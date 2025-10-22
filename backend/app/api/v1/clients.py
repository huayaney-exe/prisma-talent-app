"""
Client management endpoints.
Handles client (company) creation with admin auth invitation.
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_supabase_admin_client
from app.core.config import settings

router = APIRouter(prefix="/clients", tags=["clients"])
limiter = Limiter(key_func=get_remote_address)


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class InviteClientRequest(BaseModel):
    """Request model for sending client invitation."""
    email: EmailStr = Field(..., description="Client contact email")
    company_id: str | None = Field(None, description="Company UUID (if already created)")
    company_name: str = Field(..., description="Company name for personalization")
    company_domain: str | None = Field(None, description="Company domain")
    hr_user_id: str | None = Field(None, description="HR user UUID (if already created)")
    full_name: str = Field(..., description="Contact full name")
    contact_phone: str | None = Field(None, description="Contact phone")
    contact_position: str | None = Field(None, description="Contact position")
    industry: str | None = Field(None, description="Industry")
    company_size: str | None = Field(None, description="Company size")


class InviteClientResponse(BaseModel):
    """Response model for client invitation."""
    success: bool
    auth_user_id: str | None = None
    message: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/invite", response_model=InviteClientResponse)
@limiter.limit("10/minute")
async def invite_client(
    request: InviteClientRequest,
) -> InviteClientResponse:
    """
    Send magic link invitation to new client.

    This uses Supabase Admin Auth (service_role_key) to invite users.
    Frontend cannot do this directly as it only has anon key.

    **Flow Option 1** (company/hr_user already created):
    1. Frontend creates company + HR user records
    2. Frontend calls this endpoint with company_id and hr_user_id
    3. Backend sends invitation via Supabase Admin Auth

    **Flow Option 2** (create company/hr_user first):
    1. Frontend calls this endpoint with company details only
    2. Backend creates company + HR user
    3. Backend sends invitation via Supabase Admin Auth

    **Security**: Should verify requesting user is Prisma admin (TODO)
    """
    try:
        # Get Supabase admin client (has service_role_key)
        supabase_admin = get_supabase_admin_client()

        company_id = request.company_id
        hr_user_id = request.hr_user_id

        # If company_id not provided, create company and HR user
        if not company_id:
            # Extract domain from email
            domain = request.email.split('@')[1] if '@' in request.email else request.company_domain

            # Create company
            company_response = supabase_admin.table("companies").insert({
                "company_name": request.company_name,
                "company_domain": domain or request.company_domain,
                "primary_contact_name": request.full_name,
                "primary_contact_email": request.email,
                "primary_contact_phone": request.contact_phone,
                "industry": request.industry,
                "company_size": request.company_size,
                "subscription_status": "trial",
                "onboarding_completed": False,
            }).execute()

            if not company_response.data:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create company"
                )

            company_id = company_response.data[0]["id"]

            # Create HR user
            hr_user_response = supabase_admin.table("hr_users").insert({
                "company_id": company_id,
                "email": request.email,
                "full_name": request.full_name,
                "position_title": request.contact_position,
                "phone": request.contact_phone,
                "role": "company_admin",
                "is_active": True,
                "can_create_positions": True,
                "can_manage_team": True,
                "can_view_analytics": True,
                "created_by": None,  # First user, self-created
            }).execute()

            if not hr_user_response.data:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create HR user"
                )

            hr_user_id = hr_user_response.data[0]["id"]

        # Redirect URL for magic link
        redirect_url = f"{settings.frontend_url}/client/dashboard"

        # Send invitation via Supabase Admin Auth
        response = supabase_admin.auth.admin.invite_user_by_email(
            email=request.email,
            options={
                "data": {
                    "company_id": company_id,
                    "company_name": request.company_name,
                    "hr_user_id": hr_user_id,
                    "full_name": request.full_name,
                    "role": "client",
                },
                "redirect_to": redirect_url,
            }
        )

        if not response.user:
            raise HTTPException(
                status_code=500,
                detail="Failed to invite user - no user returned from Supabase"
            )

        # Update company with auth_user_id
        supabase_admin.table("companies").update({
            "primary_contact_auth_id": response.user.id
        }).eq("id", company_id).execute()

        # Create email_communications record for tracking
        # Note: Supabase Auth already sent the magic link email
        # This record is for internal tracking and audit trail
        try:
            from datetime import datetime

            email_comm_data = {
                "company_id": company_id,
                "email_type": "client_invitation",
                "recipient_email": request.email,
                "recipient_name": request.full_name,
                "subject_line": "Bienvenido a Prisma Talent - Acceso a tu Portal",
                "email_content": "",  # Not needed, we use template_data
                "template_data": {
                    "client_name": request.full_name,
                    "company_name": request.company_name,
                    "magic_link": f"{settings.frontend_url}/client/dashboard"  # Generic, actual link in Supabase email
                },
                "sent_at": datetime.utcnow().isoformat(),  # Already sent by Supabase
                "status": "sent",
                "resend_email_id": None  # Not sent via Resend, sent by Supabase Auth
            }

            supabase_admin.table("email_communications").insert(email_comm_data).execute()

        except Exception as e:
            # Log but don't fail the invitation
            print(f"⚠️ Failed to create email_communications record: {e}")

        return InviteClientResponse(
            success=True,
            auth_user_id=response.user.id,
            message=f"Invitation sent successfully to {request.email}"
        )

    except HTTPException:
        raise
    except Exception as e:
        # Log error for debugging
        print(f"❌ Client invitation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send invitation: {str(e)}"
        )


@router.post("/invite/{company_id}/resend", response_model=InviteClientResponse)
@limiter.limit("5/minute")
async def resend_client_invitation(
    request: Request,
    company_id: str,
) -> InviteClientResponse:
    """
    Resend invitation to existing client.

    **Use case**: When initial invitation fails or expires

    **Security**: Should verify requesting user is Prisma admin (TODO)
    """
    try:
        # Get Supabase admin client
        supabase_admin = get_supabase_admin_client()

        # Get company details
        company_response = supabase_admin.table("companies").select(
            "id, company_name, primary_contact_email, primary_contact_name"
        ).eq("id", company_id).single().execute()

        if not company_response.data:
            raise HTTPException(status_code=404, detail="Company not found")

        company = company_response.data

        # Get HR user
        hr_user_response = supabase_admin.table("hr_users").select(
            "id"
        ).eq("company_id", company_id).eq("role", "company_admin").single().execute()

        if not hr_user_response.data:
            raise HTTPException(status_code=404, detail="HR admin user not found")

        hr_user = hr_user_response.data

        # Resend invitation
        redirect_url = f"{settings.frontend_url}/client/dashboard"

        response = supabase_admin.auth.admin.invite_user_by_email(
            email=company["primary_contact_email"],
            options={
                "data": {
                    "company_id": company["id"],
                    "company_name": company["company_name"],
                    "hr_user_id": hr_user["id"],
                    "full_name": company["primary_contact_name"],
                    "role": "client",
                },
                "redirect_to": redirect_url,
            }
        )

        if not response.user:
            raise HTTPException(
                status_code=500,
                detail="Failed to resend invitation"
            )

        return InviteClientResponse(
            success=True,
            auth_user_id=response.user.id,
            message=f"Invitation resent to {company['primary_contact_email']}"
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Resend invitation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to resend invitation: {str(e)}"
        )
