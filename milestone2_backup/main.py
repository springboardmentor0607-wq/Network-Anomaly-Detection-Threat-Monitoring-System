from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.connection import Base, engine
from .api import auth, dashboard, ml_routes, threats, network

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NetShield AI API",
    description="AI-Based Intelligent Network Intrusion Detection and Cyber Threat Monitoring System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(ml_routes.router)
app.include_router(threats.router)
app.include_router(network.router)

@app.get("/")
def root():
    return {"message": "NetShield AI Cyber Defense Engine is Operational", "docs_url": "/docs"}