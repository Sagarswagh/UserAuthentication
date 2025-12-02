from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class UserBase(BaseModel):
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str

class UserLogin(BaseModel):
    email: str
    password: str
    role: str

class UserResponse(UserBase):
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    user_id: uuid.UUID

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserListResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    phone: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        orm_mode = True

