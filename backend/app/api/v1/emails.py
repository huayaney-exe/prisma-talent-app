"""Email management API endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr

from app.core.database import get_supabase_client
from app.services.email_worker import get_email_worker_health
from app.services.email_templates import EmailTemplates

router = APIRouter(prefix="/emails", tags=["emails"])


# ============================================================================
# Request/Response Models
# ============================================================================

class EmailStatusResponse(BaseModel):
    """Email communication status response."""
    id: str
    email_type: str
    recipient_email: str
    subject_line: str
    status: Optional[str]
    sent_at: Optional[str]
    delivered_at: Optional[str]
    opened_at: Optional[str]
    retry_count: int
    error_message: Optional[str]
    created_at: str


class EmailHealthResponse(BaseModel):
    """Email worker health response."""
    status: str
    running: bool
    poll_interval_seconds: int
    metrics: dict
    retry_config: dict


class RetryEmailRequest(BaseModel):
    """Retry email request."""
    email_ids: List[str]


class TestEmailRequest(BaseModel):
    """Test email request."""
    recipient_email: EmailStr
    recipient_name: str


# ============================================================================
# Health Check Endpoint
# ============================================================================

@router.get("/health", response_model=EmailHealthResponse)
async def get_email_health():
    """
    Get email worker health status and metrics.

    Returns worker status, pending emails count, and retry configuration.
    """
    health = await get_email_worker_health()
    return health


# ============================================================================
# Email Status Endpoints
# ============================================================================

@router.get("/pending", response_model=List[EmailStatusResponse])
async def get_pending_emails(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Get pending emails waiting to be sent.

    Includes emails that are scheduled for retry.
    """
    supabase = get_supabase_client()

    try:
        response = supabase.table("email_communications") \
            .select("*") \
            .is_("sent_at", "null") \
            .lt("retry_count", 3) \
            .order("created_at", desc=False) \
            .range(offset, offset + limit - 1) \
            .execute()

        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch pending emails: {str(e)}")


@router.get("/failed", response_model=List[EmailStatusResponse])
async def get_failed_emails(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Get failed emails (dead letter queue).

    Returns emails that have exceeded max retry attempts.
    """
    supabase = get_supabase_client()

    try:
        response = supabase.table("email_communications") \
            .select("*") \
            .eq("status", "failed") \
            .order("failed_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()

        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch failed emails: {str(e)}")


@router.get("/{email_id}", response_model=EmailStatusResponse)
async def get_email_status(email_id: str):
    """
    Get detailed status for a specific email.

    Includes delivery tracking information and retry history.
    """
    supabase = get_supabase_client()

    try:
        response = supabase.table("email_communications") \
            .select("*") \
            .eq("id", email_id) \
            .single() \
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Email not found")

        return response.data

    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Email not found")
        raise HTTPException(status_code=500, detail=f"Failed to fetch email: {str(e)}")


# ============================================================================
# Email Management Endpoints
# ============================================================================

@router.post("/retry")
async def retry_failed_emails(request: RetryEmailRequest):
    """
    Retry sending failed emails.

    Resets retry_count and next_retry_at to allow worker to retry.
    """
    supabase = get_supabase_client()

    try:
        # Reset retry metadata for specified emails
        response = supabase.table("email_communications") \
            .update({
                "retry_count": 0,
                "next_retry_at": None,
                "status": "retry_scheduled",
                "error_message": None
            }) \
            .in_("id", request.email_ids) \
            .execute()

        return {
            "message": f"Scheduled {len(request.email_ids)} emails for retry",
            "email_ids": request.email_ids
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule retries: {str(e)}")


@router.post("/test")
async def send_test_email(request: TestEmailRequest):
    """
    Send a test email to verify email service configuration.

    Useful for testing Resend integration and template rendering.
    """
    from app.services.email_service import EmailService

    email_service = EmailService()

    try:
        # Render test email template
        html_content = EmailTemplates.test_email(request.recipient_name)

        # Send via Resend
        result = await email_service.send_email(
            to_email=request.recipient_email,
            to_name=request.recipient_name,
            subject="🧪 Test Email - Prisma Talent",
            html_content=html_content
        )

        return {
            "message": "Test email sent successfully",
            "email_id": result.get("email_id"),
            "recipient": request.recipient_email
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send test email: {str(e)}")


# ============================================================================
# Webhook Endpoint (for Resend delivery tracking)
# ============================================================================

@router.post("/webhooks/resend")
async def resend_webhook(payload: dict):
    """
    Webhook endpoint for Resend delivery events.

    Updates email_communications table with delivery status.

    Events:
    - email.delivered: Email successfully delivered to inbox
    - email.opened: Recipient opened the email
    - email.clicked: Recipient clicked a link
    - email.bounced: Email bounced
    - email.complained: Recipient marked as spam
    """
    supabase = get_supabase_client()

    try:
        event_type = payload.get("type")
        email_data = payload.get("data", {})
        resend_email_id = email_data.get("email_id")

        if not resend_email_id:
            return {"status": "ignored", "reason": "Missing email_id"}

        # Map event type to database field
        event_mapping = {
            "email.delivered": {"delivered_at": "now()"},
            "email.opened": {"opened_at": "now()"},
            "email.clicked": {"clicked_at": "now()"},
            "email.bounced": {"bounced_at": "now()", "status": "bounced"},
            "email.complained": {"status": "complained"}
        }

        update_data = event_mapping.get(event_type, {})

        if not update_data:
            return {"status": "ignored", "reason": f"Unknown event type: {event_type}"}

        # Update email_communications record
        response = supabase.table("email_communications") \
            .update(update_data) \
            .eq("resend_email_id", resend_email_id) \
            .execute()

        return {
            "status": "processed",
            "event_type": event_type,
            "email_id": resend_email_id
        }

    except Exception as e:
        # Log error but don't fail webhook (Resend will retry)
        print(f"❌ Webhook processing error: {e}")
        return {"status": "error", "error": str(e)}


# ============================================================================
# Statistics Endpoint
# ============================================================================

@router.get("/stats/summary")
async def get_email_stats():
    """
    Get email statistics summary.

    Returns counts for different email statuses and types.
    """
    supabase = get_supabase_client()

    try:
        # Get counts by status
        total_sent = supabase.table("email_communications") \
            .select("id", count="exact") \
            .not_.is_("sent_at", "null") \
            .execute()

        total_pending = supabase.table("email_communications") \
            .select("id", count="exact") \
            .is_("sent_at", "null") \
            .lt("retry_count", 3) \
            .execute()

        total_failed = supabase.table("email_communications") \
            .select("id", count="exact") \
            .eq("status", "failed") \
            .execute()

        total_delivered = supabase.table("email_communications") \
            .select("id", count="exact") \
            .not_.is_("delivered_at", "null") \
            .execute()

        total_opened = supabase.table("email_communications") \
            .select("id", count="exact") \
            .not_.is_("opened_at", "null") \
            .execute()

        return {
            "total_sent": total_sent.count or 0,
            "total_pending": total_pending.count or 0,
            "total_failed": total_failed.count or 0,
            "total_delivered": total_delivered.count or 0,
            "total_opened": total_opened.count or 0,
            "open_rate": round((total_opened.count / total_delivered.count * 100), 2) if total_delivered.count else 0
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch email stats: {str(e)}")
