from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api import auth, users, licenses, config, analytics, assessments, evaluations

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CheckerQ Admin API",
    description="Admin portal backend for CheckerQ exam evaluation system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(licenses.router)
app.include_router(config.router)
app.include_router(analytics.router)
app.include_router(assessments.router)
app.include_router(evaluations.router)


@app.get("/")
def root():
    return {
        "message": "CheckerQ Admin API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
