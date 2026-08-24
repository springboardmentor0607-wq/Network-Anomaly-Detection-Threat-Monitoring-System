from datetime import datetime
from enum import Enum
from pydantic import AliasChoices, BaseModel, EmailStr, Field

class Role(str, Enum):
    security_administrator = "Security Administrator"
    security_analyst = "Security Analyst"

class UserRegister(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="User's full name",
        validation_alias=AliasChoices("full_name", "fullName"),
    )
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, description="Strong password")
    role: Role = Field(..., description="User role")

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")

class UserResponse(BaseModel):
    id: str = Field(..., description="User ID (string representation of MongoDB ObjectId)")
    full_name: str
    email: EmailStr
    role: Role
    is_active: bool
    created_at: datetime

    class Config:
        pass

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
