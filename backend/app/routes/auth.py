from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt
from app.database import users_collection

router = APIRouter(
)

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# Register
@router.post("/register")
def register(user: UserRegister):
    existing_user = users_collection.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt()
    )

    users_collection.insert_one({
        "username": user.username,
        "email": user.email,
        "password": hashed_password
    })

    return {"message": "User registered successfully"}

# Login
@router.post("/login")
def login(user: UserLogin):
    existing_user = users_collection.find_one({"email": user.email})

    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not bcrypt.checkpw(
        user.password.encode("utf-8"),
        existing_user["password"]
    ):
        raise HTTPException(status_code=401, detail="Incorrect password")

    return {
        "message": "Login successful",
        "username": existing_user["username"]
    }