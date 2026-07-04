"""
ReLoop AI backend entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import classify, batches, matches, dashboard

# Create tables if they don't exist yet. In Supabase, prefer running
# supabase_schema.sql once instead (see README) - this call is a safety
# net for local development against a plain Postgres instance.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ReLoop AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(classify.router)
app.include_router(batches.router)
app.include_router(matches.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "reloop-ai-backend"}
