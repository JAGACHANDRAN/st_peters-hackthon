import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "finance_platform"
    JWT_SECRET: str = "supersecretjwtkey_for_finance_platform_2026_change_in_production"
    JWT_EXPIRE_MINUTES: int = 1440
    OLLAMA_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "https://ollama.com"
    OLLAMA_MODEL: str = "gpt-oss:120b"
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
