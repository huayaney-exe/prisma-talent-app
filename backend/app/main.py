"""FastAPI application entry point."""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.api.v1 import leads, enrollment, emails, clients
from app.services.email_worker import start_email_worker, stop_email_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - starts/stops background workers."""
    # Startup: Start email worker in background
    worker_task = asyncio.create_task(start_email_worker())
    yield
    # Shutdown: Stop email worker gracefully
    await stop_email_worker()
    worker_task.cancel()


# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Prisma Talent Platform - Backend API",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment
    }


# API v1 routes
app.include_router(leads.router, prefix="/api/v1")
app.include_router(enrollment.router, prefix="/api/v1")
app.include_router(emails.router, prefix="/api/v1")
app.include_router(clients.router, prefix="/api/v1")


@app.get("/", tags=["root"])
async def root() -> dict:
    """Root endpoint."""
    return {
        "message": "Prisma Talent Platform API",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else "Documentation disabled in production",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower()
    )
