import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import HTTPException, status
import uvicorn

from app.config import settings
from app.database.database import connect_to_mongo, close_mongo_connection, db_connection
from app.models.user import create_user_indexes
from app.models.alert import create_alert_indexes
from app.models.incident import create_incident_indexes
from app.routers.api import api_router
from app.api.alerts import router as alerts_router
from app.api.incidents import router as incidents_router
from app.services.network_monitoring import _load_dataset_cache_async, get_dataset_status
from app.services.system_logger import log_system_event

import sys
if sys.platform == "win32":
    try:
        from asyncio.proactor_events import _ProactorBasePipeTransport
        _original_call_connection_lost = _ProactorBasePipeTransport._call_connection_lost

        def _patched_call_connection_lost(self, exc):
            try:
                _original_call_connection_lost(self, exc)
            except ConnectionResetError:
                pass

        _ProactorBasePipeTransport._call_connection_lost = _patched_call_connection_lost
    except ImportError:
        pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("netshield.backend")
logging.getLogger("passlib").setLevel(logging.ERROR)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events.

    Startup sequence:
      1. Connect to MongoDB
      2. Create user and alert indexes
      3. Fire dataset loading as a background asyncio task so the event loop
         — and all auth/health endpoints — stay responsive while CSVs load.
      4. Serve requests immediately.

    Dataset loading runs in asyncio.to_thread() (inside _load_dataset_cache_async)
    so it never blocks the event loop.  By the time the first dashboard request
    arrives the data is likely already in cache.
    """
    # ── 1. MongoDB ──────────────────────────────────────────────────────
    await connect_to_mongo()
    if db_connection.database is not None:
        await create_user_indexes(db_connection.database)
        await create_alert_indexes(db_connection.database)
        await create_incident_indexes(db_connection.database)
    logger.info('MongoDB connected')
    await log_system_event("INFO", "Backend Service", "Backend Startup Initiated")

    # ── 2. Kick off dataset preload in the background ────────────────────────
    logger.info('Scheduling background dataset preload ...')
    preload_task = asyncio.create_task(_load_dataset_cache_async())
    logger.info('Application ready — dataset loading in background (task id=%s)', id(preload_task))

    yield  # ← server handles requests from this point

    # ── 3. Shutdown ──────────────────────────────────────────────────────
    await log_system_event("INFO", "Backend Service", "Server Shutdown")
    if not preload_task.done():
        preload_task.cancel()
    await close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS configuration
origins = [str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("Request started: %s %s", request.method, request.url.path)
    try:
        response = await call_next(request)
        logger.info("Request completed: %s %s -> %s", request.method, request.url.path, response.status_code)
        return response
    except Exception as exc:
        logger.exception("Unhandled error while processing %s %s", request.method, request.url.path)
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        detail = "Internal server error"
        
        if isinstance(exc, HTTPException):
            status_code = exc.status_code
            detail = exc.detail
            
        response = JSONResponse(
            status_code=status_code,
            content={"detail": detail}
        )
        return _add_cors_headers(request, response)

def _add_cors_headers(request: Request, response: JSONResponse) -> JSONResponse:
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    headers = exc.headers or {}
    response = JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=headers)
    return _add_cors_headers(request, response)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    response = JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": exc.errors()})
    return _add_cors_headers(request, response)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception for %s %s", request.method, request.url.path)
    await log_system_event("ERROR", "API Gateway", f"Unhandled exception in {request.method} {request.url.path}", exception=str(exc))
    response = JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail": "Internal server error"})
    return _add_cors_headers(request, response)

from app.api.websocket import router as ws_router

# Include the centralized API router
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
app.include_router(ws_router, prefix="/ws", tags=["websocket"])
app.include_router(incidents_router, prefix="/incidents", tags=["incidents"])

# Mount reports directory for evaluation metrics & charts
from pathlib import Path
from fastapi.staticfiles import StaticFiles

reports_dir = Path(__file__).resolve().parent.parent / "reports"
reports_dir.mkdir(parents=True, exist_ok=True)
app.mount("/reports", StaticFiles(directory=reports_dir), name="reports")
app.mount(f"{settings.API_V1_STR}/reports", StaticFiles(directory=reports_dir), name="api_reports")

@app.get("/", tags=["system"])
async def root():
    """Root route returning service meta-information."""
    return {
        "app": settings.PROJECT_NAME,
        "api_docs": f"{settings.API_V1_STR}/docs" if app.openapi_url else None,
        "status": "active"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
