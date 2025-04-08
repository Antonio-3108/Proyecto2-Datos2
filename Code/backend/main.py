# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from fastapi.middleware.cors import CORSMiddleware
import models, schemas, crud
import redis
import uuid
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from pymongo import MongoClient
from fastapi.encoders import jsonable_encoder
from typing import List

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conectar a Redis
redis_client = redis.Redis(host="redis", port=6379, db=0, decode_responses=True)
SESSION_EXPIRE_TIME = 60 * 60 * 24 * 30  # 1 mes

# Conexiones de Mongo
mongo_client = MongoClient("mongodb://mongo_user:mongo_pass@mongo:27017/")
mongo_db = mongo_client["online_store"]
mongo_products = mongo_db["products"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/test")
def get_keys():
    return redis_client.keys()


@app.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)


@app.post("/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    authenticated_user = crud.authenticate_user(db, user)
    if not authenticated_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = str(uuid.uuid4())
    redis_client.setex(session_id, SESSION_EXPIRE_TIME, authenticated_user.username)

    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(
        key="session_id",
        value=session_id,
        max_age=SESSION_EXPIRE_TIME,
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return response


def get_current_user(request: Request):
    session_id = request.cookies.get("session_id")
    if session_id and redis_client.exists(session_id):
        username = redis_client.get(session_id)
        return username
    raise HTTPException(status_code=401, detail="Session expired or invalid")


@app.get("/products")
def get_products(db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    return crud.get_products(db)


@app.get("/categories")
def get_categories(db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    return crud.get_categories(db)


@app.post("/checkout")
def checkout(cart: schemas.Cart, db: Session = Depends(get_db), username: str = Depends(get_current_user)):
    # Obtener el user_id a partir del username
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return crud.create_order(db, cart, user.id)


# Endpoint de búsqueda usando MongoDB
@app.get("/search")
async def search_products(query: str = Query(..., min_length=1), username: str = Depends(get_current_user)):
    # Buscar en la base de datos PostgreSQL en lugar de MongoDB
    db = SessionLocal()
    try:
        # Obtener todos los productos
        products = crud.get_products(db)
        
        # Filtrar los productos que coincidan con la consulta
        search_results = [
            product for product in products 
            if query.lower() in product.name.lower()
        ]
        
        return search_results
    finally:
        db.close()


@app.post("/cart/add", response_model=schemas.CartItem)
def add_to_cart(
    item: schemas.CartItemCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    return crud.add_to_cart(db, user_id, item.product_id, item.quantity)

@app.put("/cart/items/{item_id}", response_model=schemas.CartItem)
def update_cart_item(
    item_id: int,
    quantity: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    return crud.update_cart_item_quantity(db, item_id, quantity)

@app.delete("/cart/items/{item_id}")
def remove_from_cart(
    item_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    return crud.remove_from_cart(db, item_id)

@app.get("/cart", response_model=schemas.Cart)
def get_cart(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    cart = crud.get_cart(db, user_id)
    if not cart:
        cart = crud.create_cart(db, user_id)
    return cart

@app.delete("/cart/clear")
def clear_cart(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    return crud.clear_cart(db, user_id)

