from fastapi import APIRouter, HTTPException, status, Request, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import fetch_one, execute_query
from auth import hash_password, verify_password, generate_token, get_current_user
from mongo_db import log_mongo_audit_event

auth_router = APIRouter(tags=["Authentication"])
auth_bp = auth_router  # Alias for compatibility

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: Optional[str] = None
    confirmPassword: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

@auth_router.post('/register', status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, request: Request):
    name = req.name.strip()
    email = req.email.strip().lower()
    password = req.password
    confirm_password = req.confirm_password or req.confirmPassword or ''
    
    role = 'SECURITY_ANALYST'
    
    if not name or not email or not password:
        raise HTTPException(status_code=400, detail='Name, email, and password are required fields.')
        
    if len(password) < 6:
        raise HTTPException(status_code=400, detail='Password must be at least 6 characters in length.')
        
    if confirm_password and password != confirm_password:
        raise HTTPException(status_code=400, detail='Password and Confirm Password do not match.')
    
    existing = fetch_one("SELECT id FROM users WHERE email = %s", (email,))
    if existing:
        raise HTTPException(status_code=400, detail='An account with this email address already exists.')
    
    pwd_hash = hash_password(password)
    try:
        user_id = execute_query(
            "INSERT INTO users (name, email, password_hash, role, status) VALUES (%s, %s, %s, %s, 'ACTIVE') RETURNING id",
            (name, email, pwd_hash, role)
        )
        
        client_ip = request.client.host if request.client else '127.0.0.1'
        execute_query(
            "INSERT INTO audit_logs (user_id, action, module, ip_address) VALUES (%s, %s, %s, %s)",
            (user_id, 'PUBLIC_USER_REGISTERED', 'AUTH', client_ip)
        )
        log_mongo_audit_event(user_id, 'PUBLIC_USER_REGISTERED', 'AUTH', client_ip)
        
        return {
            'message': 'Account registered successfully! Please sign in to your account.',
            'user': {
                'id': user_id,
                'name': name,
                'email': email,
                'role': role,
                'status': 'ACTIVE'
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Registration failed: {str(e)}')

@auth_router.post('/login')
async def login(req: LoginRequest, request: Request):
    email = req.email.strip().lower()
    password = req.password
    
    if not email or not password:
        raise HTTPException(status_code=400, detail='Email and password are required.')
    
    user = fetch_one("SELECT id, name, email, password_hash, role, status FROM users WHERE email = %s", (email,))
    if not user:
        # Check hardcoded default credentials fallback for zero-config offline start
        if email == 'admin@netshield.ai' and password == 'Admin@123':
            token = generate_token(1, email, 'ADMIN')
            return {
                'message': 'Login successful.',
                'token': token,
                'user': {'id': 1, 'name': 'SOC Administrator', 'email': email, 'role': 'ADMIN', 'status': 'ACTIVE'}
            }
        elif email == 'analyst@netshield.ai' and password == 'Analyst@123':
            token = generate_token(2, email, 'SECURITY_ANALYST')
            return {
                'message': 'Login successful.',
                'token': token,
                'user': {'id': 2, 'name': 'Security Analyst', 'email': email, 'role': 'SECURITY_ANALYST', 'status': 'ACTIVE'}
            }
        raise HTTPException(status_code=401, detail='Invalid credentials. Please check your email and password.')
    
    if user.get('status') != 'ACTIVE':
        raise HTTPException(status_code=403, detail='Your account has been deactivated. Please contact a system administrator.')
    
    if not verify_password(user.get('password_hash', ''), password):
        raise HTTPException(status_code=401, detail='Invalid credentials. Please check your email and password.')
    
    client_ip = request.client.host if request.client else '127.0.0.1'
    try:
        execute_query("UPDATE users SET updated_at = NOW() WHERE id = %s", (user['id'],))
        execute_query(
            "INSERT INTO audit_logs (user_id, action, module, ip_address) VALUES (%s, %s, %s, %s)",
            (user['id'], 'USER_LOGIN', 'AUTH', client_ip)
        )
        log_mongo_audit_event(user['id'], 'USER_LOGIN', 'AUTH', client_ip)
    except Exception:
        pass
    
    token = generate_token(user['id'], user['email'], user['role'])
    
    return {
        'message': 'Login successful.',
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'status': user['status']
        }
    }

@auth_router.get('/me')
async def get_me(current_user: dict = Depends(get_current_user)):
    return {'user': current_user}

