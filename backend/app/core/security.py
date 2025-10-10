"""Authentication and authorization utilities."""

from typing import Optional
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from supabase import Client
from app.core.config import settings
from app.core.database import get_db

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
) -> dict:
    """
    Verify JWT token and return authenticated user data.

    Args:
        credentials: HTTP Bearer token from Authorization header
        db: Supabase client

    Returns:
        User data from Supabase auth

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        token = credentials.credentials

        # Verify token with Supabase
        user_response = db.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user_response.user.model_dump()

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_prisma_admin(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
) -> dict:
    """
    Verify user is an active Prisma admin.

    Args:
        current_user: Authenticated user from get_current_user
        db: Supabase client

    Returns:
        Prisma admin data including permissions

    Raises:
        HTTPException: If user is not a Prisma admin or inactive
    """
    try:
        result = db.table("prisma_admins").select("*").eq(
            "auth_user_id", current_user["id"]
        ).eq("is_active", True).single().execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized: Prisma admin access required"
            )

        return result.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Admin verification failed: {str(e)}"
        )


async def get_current_hr_user(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
) -> dict:
    """
    Verify user is an active HR user.

    Args:
        current_user: Authenticated user from get_current_user
        db: Supabase client

    Returns:
        HR user data including company information

    Raises:
        HTTPException: If user is not an HR user or inactive
    """
    try:
        result = db.table("hr_users").select(
            "*, companies(*)"
        ).eq(
            "auth_user_id", current_user["id"]
        ).eq(
            "is_active", True
        ).single().execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized: HR user access required"
            )

        return result.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"HR user verification failed: {str(e)}"
        )


async def verify_company_access(
    company_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
) -> bool:
    """
    Verify user has access to specific company data.

    Args:
        company_id: UUID of company to check access
        current_user: Authenticated user
        db: Supabase client

    Returns:
        True if user has access

    Raises:
        HTTPException: If user doesn't have access to company
    """
    # Check if Prisma admin
    try:
        admin_result = db.table("prisma_admins").select("id").eq(
            "auth_user_id", current_user["id"]
        ).eq("is_active", True).execute()

        if admin_result.data:
            return True  # Admins have access to all companies

    except Exception:
        pass

    # Check if HR user belongs to company
    try:
        hr_result = db.table("hr_users").select("id").eq(
            "auth_user_id", current_user["id"]
        ).eq("company_id", company_id).eq("is_active", True).execute()

        if hr_result.data:
            return True

    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to access this company's data"
    )


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token.

    Args:
        data: Data to encode in token
        expires_delta: Token expiration time

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )

    return encoded_jwt
