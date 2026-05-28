"""Core configuration — settings loaded from environment variables.

Every field `X` is read from the env var `APP_X` (see `model_config`).
Sane defaults make the app boot with zero configuration in dev; override
via `.env` or real environment variables in production.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Identity (defaults; rarely overridden) ---
    NAME: str = "myapp"
    VERSION: str = "0.1.0"
    DEBUG: bool = False

    # --- Server ports ---
    BACKEND_PORT: int = 8000
    FRONTEND_PORT: int = 3000

    # --- Authentication ---
    # Bearer-token gate on the API. Empty string = disabled (trusted network /
    # dev). When set, every protected route requires `Authorization: Bearer <key>`.
    API_KEY: str = ""
    # Comma-separated CORS allowlist. Empty falls back to the local dev origins.
    CORS_ORIGINS: str = ""

    # --- MongoDB ---
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "myapp"

    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
