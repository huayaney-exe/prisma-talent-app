"""Database connection and dependency injection."""

from typing import Generator
from supabase import create_client, Client
from app.core.config import settings


def get_supabase_client() -> Client:
    """
    Create Supabase client with anon key.

    Used for RLS-protected operations where user authentication is enforced.
    """
    return create_client(settings.supabase_url, settings.supabase_key)


def get_supabase_admin_client() -> Client:
    """
    Create Supabase client with service role key.

    Used for admin operations that bypass RLS (use carefully).
    Only use for:
    - Initial setup operations
    - Background jobs
    - Admin-only operations that need to bypass RLS
    """
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


# Dependency for FastAPI endpoints
def get_db() -> Generator[Client, None, None]:
    """
    FastAPI dependency to inject Supabase client.

    Usage:
        @router.get("/endpoint")
        async def endpoint(db: Client = Depends(get_db)):
            result = db.table("table_name").select("*").execute()
    """
    client = get_supabase_client()
    try:
        yield client
    finally:
        # Supabase client doesn't need explicit cleanup
        pass


def get_admin_db() -> Generator[Client, None, None]:
    """
    FastAPI dependency to inject Supabase admin client (bypass RLS).

    ⚠️ Use with caution - bypasses Row-Level Security.

    Usage:
        @router.post("/admin/endpoint")
        async def admin_endpoint(
            db: Client = Depends(get_admin_db),
            admin: dict = Depends(get_current_prisma_admin)
        ):
            # Verify admin permissions before using this client
            result = db.table("table_name").select("*").execute()
    """
    client = get_supabase_admin_client()
    try:
        yield client
    finally:
        pass
