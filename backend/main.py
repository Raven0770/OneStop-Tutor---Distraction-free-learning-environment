from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import engine
from models import Base
import routes_users
import routes_courses
import routes_videos
import routes_progress
import routes_ai
import routes_timestamps

# Create database tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown."""
    print("🚀 OneStop Tutor API Starting...")
    yield
    print("🛑 OneStop Tutor API Shutting Down...")


# Initialize FastAPI app
app = FastAPI(
    title="OneStop Tutor API",
    description="AI-Powered Learning Journey Builder",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(routes_users.router)
app.include_router(routes_courses.router)
app.include_router(routes_videos.router)
app.include_router(routes_progress.router)
app.include_router(routes_ai.router)
app.include_router(routes_timestamps.router)


@app.get("/")
async def root():
    """API health check."""
    return {
        "message": "Welcome to OneStop Tutor API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "OneStop Tutor API"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
