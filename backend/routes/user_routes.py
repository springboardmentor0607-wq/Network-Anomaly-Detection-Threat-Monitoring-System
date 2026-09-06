from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from database import fetch_all, fetch_one, execute_query
from auth import get_current_user, require_role, hash_password

user_router = APIRouter(tags=['User Management'])
user_bp = user_router

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = 'SECURITY_ANALYST'
    status: Optional[str] = 'ACTIVE'

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

@user_router.get('/users')
async def get_users(current_user: dict = Depends(require_role(['ADMIN', 'SECURITY_ANALYST', 'AUDITOR']))):
    users = fetch_all("SELECT id, name, email, role, status, created_at FROM users ORDER BY id ASC")
    return {'users': users or []}

@user_router.post('/users')
async def create_user(req: UserCreate, current_user: dict = Depends(require_role(['ADMIN']))):
    existing = fetch_one("SELECT id FROM users WHERE email = %s", (req.email,))
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered.')
    pwd_hash = hash_password(req.password)
    user_id = execute_query(
        """INSERT INTO users (name, email, password_hash, role, status)
           VALUES (%s, %s, %s, %s, %s) RETURNING id""",
        (req.name, req.email, pwd_hash, req.role or 'SECURITY_ANALYST', req.status or 'ACTIVE')
    )
    return {'message': 'User created successfully', 'user_id': user_id}

@user_router.put('/users/{user_id}')
async def update_user(user_id: int, req: UserUpdate, current_user: dict = Depends(require_role(['ADMIN']))):
    if req.status:
        execute_query("UPDATE users SET status = %s WHERE id = %s", (req.status, user_id))
    if req.role:
        execute_query("UPDATE users SET role = %s WHERE id = %s", (req.role, user_id))
    if req.name:
        execute_query("UPDATE users SET name = %s WHERE id = %s", (req.name, user_id))
    return {'message': f'User #{user_id} updated successfully.'}
