from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    gemini_api_key: str = ""
    openai_api_key: str = ""
    groq_api_key: str = ""
    openai_model: str = "gemini-1.5-flash"

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "resumeai"

    app_secret_key: str = "change-me"
    max_upload_size_mb: int = 10
    allowed_origins: str = "http://localhost:8000"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()