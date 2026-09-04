from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.connection import Base, engine
from .api import auth, dashboard, ml_routes, threats, network, soc_routes

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NetShield AI Cyber Defense SOC Engine",
    description="AI-Driven Network Intrusion Detection & Real-Time Incident Operations",
    version="3.0.0"
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
app.include_router(soc_routes.router)


@app.get("/")
def root():
    return {
        "status": "Operational",
        "system": "NetShield AI SOC Platform",
        "version": "Milestone 3 Enabled",
        "docs_url": "/docs"
    }
