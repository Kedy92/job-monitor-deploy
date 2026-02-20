from fastapi import FastAPI

from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.monitors import router as monitors_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=settings.APP_NAME)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "env": settings.ENV}
