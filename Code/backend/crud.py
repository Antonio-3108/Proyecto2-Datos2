from sqlalchemy.orm import Session
import models, schemas
from typing import List

# CRUD functions for User
def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(username=user.username, password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, user: schemas.UserLogin):
    return db.query(models.User).filter(models.User.username == user.username, models.User.password == user.password).first()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

# CRUD functions for Product
def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def get_products(db: Session):
    return db.query(models.Product).all()

# CRUD functions for Category
def create_category(db: Session, category: schemas.ProductCategoryCreate):
    db_category = models.ProductCategory(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_categories(db: Session):
    return db.query(models.ProductCategory).all()

# CRUD functions for Order
def create_order(db: Session, cart: schemas.Cart, user_id: int):
    # Crear una nueva orden
    db_order = models.Order(user_id=user_id)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Añadir los items del carrito a la orden
    for item in cart.items:
        db_order_item = models.OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(db_order_item)
    
    db.commit()
    return db_order

def get_cart(db: Session, user_id: int):
    return db.query(models.Cart).filter(models.Cart.user_id == user_id).first()

def create_cart(db: Session, user_id: int):
    db_cart = models.Cart(user_id=user_id)
    db.add(db_cart)
    db.commit()
    db.refresh(db_cart)
    return db_cart

def get_or_create_cart(db: Session, user_id: int):
    cart = get_cart(db, user_id)
    if not cart:
        cart = create_cart(db, user_id)
    return cart

def add_to_cart(db: Session, user_id: int, product_id: int, quantity: int = 1):
    cart = get_or_create_cart(db, user_id)
    cart_item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.id,
        models.CartItem.product_id == product_id
    ).first()
    
    if cart_item:
        cart_item.quantity += quantity
    else:
        cart_item = models.CartItem(
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity
        )
        db.add(cart_item)
    
    db.commit()
    db.refresh(cart_item)
    return cart_item

def update_cart_item_quantity(db: Session, cart_item_id: int, quantity: int):
    cart_item = db.query(models.CartItem).filter(models.CartItem.id == cart_item_id).first()
    if cart_item:
        cart_item.quantity = quantity
        db.commit()
        db.refresh(cart_item)
    return cart_item

def remove_from_cart(db: Session, cart_item_id: int):
    cart_item = db.query(models.CartItem).filter(models.CartItem.id == cart_item_id).first()
    if cart_item:
        db.delete(cart_item)
        db.commit()
    return cart_item

def get_cart_items(db: Session, user_id: int):
    cart = get_cart(db, user_id)
    if not cart:
        return []
    return db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).all()

def clear_cart(db: Session, user_id: int):
    cart = get_cart(db, user_id)
    if cart:
        db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).delete()
        db.commit()
    return cart
