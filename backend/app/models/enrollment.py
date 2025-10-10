"""Pydantic models for Client Enrollment."""

from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


class ClientEnrollmentCreate(BaseModel):
    """Request to enroll a new client (Prisma admin only)."""

    # Company information
    company_name: str = Field(..., min_length=2, max_length=100)
    company_domain: str = Field(..., min_length=3, max_length=100)
    industry: Optional[str] = None
    company_size: Optional[Literal[
        "1-10", "11-50", "51-200", "201-1000", "1000+"
    ]] = None
    website_url: Optional[str] = None

    # Primary HR user
    hr_email: EmailStr
    hr_full_name: str = Field(..., min_length=2, max_length=100)
    hr_position: Optional[str] = None
    hr_phone: Optional[str] = None

    # Subscription
    subscription_plan: Literal["basic", "premium", "enterprise"] = "basic"

    class Config:
        json_schema_extra = {
            "example": {
                "company_name": "Tech Startup SAC",
                "company_domain": "techstartup.com",
                "industry": "Technology",
                "company_size": "11-50",
                "website_url": "https://techstartup.com",
                "hr_email": "hr@techstartup.com",
                "hr_full_name": "María García",
                "hr_position": "HR Manager",
                "hr_phone": "+51999888777",
                "subscription_plan": "basic"
            }
        }


class ClientEnrollmentResponse(BaseModel):
    """Response after client enrollment."""

    company_id: str
    hr_user_id: str
    invitation_token: str
    message: str = "Client enrolled successfully"
    next_steps: str

    class Config:
        json_schema_extra = {
            "example": {
                "company_id": "550e8400-e29b-41d4-a716-446655440000",
                "hr_user_id": "660e8400-e29b-41d4-a716-446655440001",
                "invitation_token": "token_abc123",
                "message": "Client enrolled successfully",
                "next_steps": "HR user will receive onboarding email with platform access"
            }
        }
