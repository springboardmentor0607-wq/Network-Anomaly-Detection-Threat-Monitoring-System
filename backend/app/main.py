import sys
import asyncio

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, network, ml, live_traffic, database, users
from app.database import engine, Base

# Create relational tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NetShield API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(network.router, prefix="/api/network", tags=["Network"])
app.include_router(ml.router, prefix="/api/ml", tags=["Machine Learning"])
app.include_router(live_traffic.router, prefix="/api/live", tags=["Live Traffic"])
app.include_router(database.router, prefix="/api/database", tags=["Database Management"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
@app.get("/")
def read_root():
    return {"message": "Welcome to NetShield API"}
