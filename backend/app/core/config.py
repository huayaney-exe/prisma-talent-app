"""Application configuration using Pydantic Settings."""

from typing import List
from pydantic import EmailStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    app_name: str = "Prisma Talent API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

    # CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:8000"

    @field_validator("allowed_origins")
    @classmethod
    def parse_origins(cls, v: str) -> List[str]:
        """Parse comma-separated origins into list."""
        return [origin.strip() for origin in v.split(",")]

    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str

    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Email (Resend)
    resend_api_key: str
    from_email: EmailStr = "hello@getprisma.io"
    reply_to_email: EmailStr = "hello@getprisma.io"

    # Rate Limiting
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000

    # Admin
    default_admin_email: EmailStr = "admin@getprisma.io"

    # Frontend URLs
    frontend_url: str = "https://talent.getprisma.io"
    admin_dashboard_url: str = "https://talent.getprisma.io/admin"
    client_portal_url: str = "https://talent.getprisma.io/portal"

    # Optional services
    sentry_dsn: str = ""
    posthog_api_key: str = ""
    posthog_host: str = "https://app.posthog.com"

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "development"


# Singleton instance
settings = Settings()
