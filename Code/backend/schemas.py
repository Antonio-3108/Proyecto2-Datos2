from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# User schema
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# Product schema
class ProductBase(BaseModel):
    name: str
    price: float
    category_id: int

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True

class ProductCategoryBase(BaseModel):
    name: str

class ProductCategoryCreate(ProductCategoryBase):
    pass

class ProductCategoryResponse(ProductCategoryBase):
    id: int

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemCreate(CartItemBase):
    pass

class CartItem(CartItemBase):
    id: int
    cart_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CartBase(BaseModel):
    pass

class CartCreate(CartBase):
    pass

class Cart(CartBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    items: List[CartItem] = []

    class Config:
        orm_mode = True