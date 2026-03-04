from fastapi import FastAPI

from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.monitors import router as monitors_router

from app.routers.ai_tools import router as ai_router

from app.routers.notifications_test import router as notifications_test_router

from fastapi.middleware.cors import CORSMiddleware


from contextlib import asynccontextmanager

from app.api.routes.applications import router as applications_router

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.db.session import SessionLocal
from app.services.worker import run_monitor_checks


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
async def lifespan(app):
    # start scheduler
    scheduler.add_job(
        scheduler_job,
        trigger=IntervalTrigger(seconds=30),  # change to minutes later
        id="monitor_checks",
        replace_existing=True,
    )
    scheduler.start()
    print("[scheduler] started")

    yield

    scheduler.shutdown(wait=False)
    print("[scheduler] stopped")


app = FastAPI(title=settings.APP_NAME)
app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "env": settings.ENV}
