from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.monitors import router as monitors_router
from app.routers.ai_tools import router as ai_router
from app.routers.notifications_test import router as notifications_test_router
from app.api.routes.applications import router as applications_router
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.db.session import SessionLocal
from app.services.worker import run_monitor_checks
from app.api.routes.cv_versions import router as cv_versions_router


def scheduler_job():
    db = SessionLocal()
    try:
        count = run_monitor_checks(db)
        print(f"[scheduler] checked {count} monitors")
    except Exception as e:
        print(f"[scheduler] ERROR: {e}")
    finally:
        db.close()


scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        scheduler_job,
        trigger=IntervalTrigger(minutes=settings.SCHEDULER_INTERVAL_MINUTES),
        id="monitor_checks",
        replace_existing=True,
    )
    scheduler.start()
    print("[scheduler] started")

    yield

    scheduler.shutdown(wait=False)
    print("[scheduler] stopped")


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(monitors_router)

# include routers AFTER app exists
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(notifications_test_router)
app.include_router(ai_router)
app.include_router(applications_router)
app.include_router(cv_versions_router)


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "env": settings.ENV}
