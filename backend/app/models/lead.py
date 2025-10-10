"""Pydantic models for Lead Management."""

from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class LeadCreate(BaseModel):
    """Lead form submission from landing page."""

    # Contact information
    contact_name: str = Field(..., min_length=2, max_length=100)
    position: str = Field(..., min_length=2, max_length=100)
    company_name: str = Field(..., min_length=2, max_length=100)
    contact_email: EmailStr
    contact_phone: str = Field(..., min_length=8, max_length=20)

    # Intent
    intent: Literal["hiring", "conversation"]

    # Optional position details (if intent = "hiring")
    role_title: Optional[str] = Field(None, max_length=100)
    role_type: Optional[Literal[
        "Product Manager",
        "Growth Manager",
        "Product Designer",
        "Engineering Manager",
        "Data/Analytics",
        "Otro"
    ]] = None
    level: Optional[Literal[
        "Mid-level (3-5 años)",
        "Senior (5-8 años)",
        "Lead/Staff (8+ años)",
        "Director+ (10+ años)"
    ]] = None
    work_mode: Optional[Literal["Presencial", "Híbrido", "Remoto"]] = None
    urgency: Optional[Literal["ASAP", "Standard", "Flexible"]] = None

    # Metadata
    terms_acceptance: bool = Field(..., description="Must be True")

    @field_validator("contact_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Validate phone number format."""
        # Remove common separators
        cleaned = re.sub(r"[\s\-\(\)]", "", v)

        # Must start with + and have 8-15 digits
        if not re.match(r"^\+?\d{8,15}$", cleaned):
            raise ValueError("Invalid phone number format")

        return v

    @field_validator("terms_acceptance")
    @classmethod
    def validate_terms(cls, v: bool) -> bool:
        """Ensure terms are accepted."""
        if not v:
            raise ValueError("Terms and conditions must be accepted")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "contact_name": "Juan Pérez",
                "position": "VP Product",
                "company_name": "Tech Startup SAC",
                "contact_email": "juan.perez@techstartup.com",
                "contact_phone": "+51999999999",
                "intent": "hiring",
                "role_title": "Senior Product Manager",
                "role_type": "Product Manager",
                "level": "Senior (5-8 años)",
                "work_mode": "Híbrido",
                "urgency": "Standard",
                "terms_acceptance": True
            }
        }


class LeadResponse(BaseModel):
    """Response after lead submission."""

    id: str
    company_id: str
    message: str = "Lead submitted successfully"
    next_steps: str = "We'll contact you within 24 hours to schedule a 15-minute call"

    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "company_id": "660e8400-e29b-41d4-a716-446655440001",
                "message": "Lead submitted successfully",
                "next_steps": "We'll contact you within 24 hours to schedule a 15-minute call"
            }
        }


class LeadListResponse(BaseModel):
    """Response for list of leads (admin only)."""

    id: str
    company_name: str
    contact_name: str
    contact_email: str
    intent: str
    lead_submitted_at: datetime
    subscription_status: str

    class Config:
        from_attributes = True
