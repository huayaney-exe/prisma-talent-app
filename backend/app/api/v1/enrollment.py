"""Client enrollment API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.core.database import get_db
from app.core.security import get_current_prisma_admin
from app.models.enrollment import ClientEnrollmentCreate, ClientEnrollmentResponse
from app.services.enrollment_service import EnrollmentService

router = APIRouter(prefix="/enrollment", tags=["enrollment"])


@router.post(
    "",
    response_model=ClientEnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Enroll new client (Admin only)",
    description="Enroll a new client company and create primary HR user. Prisma admin only."
)
async def enroll_client(
    enrollment_data: ClientEnrollmentCreate,
    db: Client = Depends(get_db),
    admin: dict = Depends(get_current_prisma_admin)
) -> ClientEnrollmentResponse:
    """
    Enroll new client company (Prisma admin only).

    **Workflow**:
    1. Create/update company record (status: trial)
    2. Create primary HR user with invitation token
    3. Send onboarding email to HR user
    4. Company marked as onboarded automatically (via trigger)

    **Access**: Prisma admin only

    **Email Notifications**:
    - HR user receives onboarding email with portal access

    **Returns**: Company ID, HR user ID, and invitation token
    """
    service = EnrollmentService(db)

    try:
        result = await service.enroll_client(
            enrollment_data=enrollment_data,
            enrolled_by_admin_id=admin["id"]
        )

        return ClientEnrollmentResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Client enrollment failed: {str(e)}"
        )


@router.get(
    "/clients",
    response_model=list,
    summary="Get enrolled clients (Admin only)",
    description="Get list of all enrolled clients (trial/active status)"
)
async def get_enrolled_clients(
    db: Client = Depends(get_db),
    admin: dict = Depends(get_current_prisma_admin)
) -> list:
    """
    Get list of enrolled clients.

    **Access**: Prisma admin only

    **Returns**: List of companies with trial/active status
    """
    try:
        result = db.table("companies").select(
            "id, company_name, company_domain, subscription_status, "
            "subscription_plan, onboarding_completed, created_at"
        ).in_(
            "subscription_status", ["trial", "active"]
        ).order("created_at", desc=True).execute()

        return result.data if result.data else []

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch clients: {str(e)}"
        )
