from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Job Monitor"
    ENV: str = "dev"

    DATABASE_URL: str
    AI_PROVIDER: str = "openai"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-5-mini"
    ANTHROPIC_API_KEY: str = ""
    SECRET_KEY: str = "dev-secret-change-in-production"
    SCHEDULER_INTERVAL_MINUTES: int = 5
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:80",
            "http://localhost",
        ]
    )
    BACKEND_CORS_ORIGIN_REGEX: str = r"https://.*\.vercel\.app"


settings = Settings()
