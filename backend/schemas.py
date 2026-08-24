from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    role: str  # "analyst" or "administrator"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True  # allows creating this from a SQLAlchemy model directly


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse