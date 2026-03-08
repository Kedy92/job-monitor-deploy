from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Job Monitor"
    ENV: str = "dev"

    DATABASE_URL: str
    ANTHROPIC_API_KEY: str = ""
    SECRET_KEY: str = "dev-secret-change-in-production"
    SCHEDULER_INTERVAL_MINUTES: int = 5


settings = Settings()
