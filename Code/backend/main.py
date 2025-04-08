# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, Query
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
    return crud.create_order(db, cart)


# Endpoint de búsqueda usando MongoDB
@app.get("/search")
async def search_products(query: str = Query(..., min_length=1), username: str = Depends(get_current_user)):
    # Buscar en MongoDB
    search = mongo_products.find(
        {"name": {"$regex": query, "$options": "i"}},
        {"_id": 0}
    )
    
    search_results = list(search)
    return search_results

