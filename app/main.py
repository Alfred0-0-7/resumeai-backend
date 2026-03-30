from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.config import get_settings
from app.database import ping_db, close_db
from app.routes.analyze import router as analyze_router
from app.routes.history import router as history_router
from app.routes.chat import router as chat_router

settings = get_settings()

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_ok = await ping_db()
    if db_ok:
        print("✅ MongoDB connected.")
    else:
        print("⚠️  MongoDB connection failed.")
    yield
    await close_db()


app = FastAPI(
    title="ResumeAI API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routes ─────────────────────────────────────────────────────
app.include_router(analyze_router, prefix="/api", tags=["Analysis"])
app.include_router(history_router, prefix="/api", tags=["History"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])


# ── Health Check ───────────────────────────────────────────────────
@app.get("/api/health", tags=["System"])
async def health():
    db_ok = await ping_db()
    return {"status": "ok", "mongodb": "connected" if db_ok else "disconnected"}


# ── Frontend Pages ─────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


@app.get("/dashboard", include_in_schema=False)
async def dashboard():
    return FileResponse(os.path.join(FRONTEND_DIR, "dashboard.html"))


@app.get("/history", include_in_schema=False)
async def history_page():
    return FileResponse(os.path.join(FRONTEND_DIR, "history.html"))


# ── Static Files MUST be LAST ──────────────────────────────────────
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")