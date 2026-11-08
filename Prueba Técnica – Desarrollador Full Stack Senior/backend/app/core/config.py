from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SESSION_IDLE_MINUTES: int = 30
    SESSION_MAX_HOURS: int = 8
    SESSION_COOKIE_SECURE: bool = False

    model_config = SettingsConfigDict(
        env_file="app/.env",
        extra="ignore"
    )


settings = Settings()
