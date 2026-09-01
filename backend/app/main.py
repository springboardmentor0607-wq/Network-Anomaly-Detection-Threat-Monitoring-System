import logging
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_v1_router
from app.api.v1.websocket import router as ws_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("netshield-ai")

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware Configuration
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API v1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)
app.include_router(ws_router, prefix=settings.API_V1_STR)

@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "1.0.0"
    }

@app.get(f"{settings.API_V1_STR}/health", status_code=status.HTTP_200_OK, tags=["Health"])
def api_v1_health():
    return {
        "status": "healthy",
        "api_version": "v1",
        "app": settings.APP_NAME
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
