"""Lead management API endpoints."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.core.database import get_db
from app.core.security import get_current_prisma_admin
from app.models.lead import LeadCreate, LeadResponse, LeadListResponse
from app.services.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post(
    "",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit interest form (Public)",
    description="Public endpoint for lead capture from landing page. No authentication required."
)
async def create_lead(
    lead_data: LeadCreate,
    db: Client = Depends(get_db)
) -> LeadResponse:
    """
    Submit lead form from landing page.

    **Workflow**:
    1. Validate input data (automatic via Pydantic)
    2. Create company record (status: 'lead')
    3. Send confirmation email to lead
    4. Send notification to Prisma admin
    5. Return success response

    **Access**: Public (no authentication)

    **Rate Limit**: 10 requests per minute per IP

    **Example Request**:
    ```json
    {
        "contact_name": "Juan Pérez",
        "position": "VP Product",
        "company_name": "Tech Startup SAC",
        "contact_email": "juan@techstartup.com",
        "contact_phone": "+51999999999",
        "intent": "hiring",
        "role_title": "Senior Product Manager",
        "role_type": "Product Manager",
        "level": "Senior (5-8 años)",
        "work_mode": "Híbrido",
        "urgency": "Standard",
        "terms_acceptance": true
    }
    ```

    **Returns**: Lead ID and next steps message
    """
    service = LeadService(db)

    try:
        result = await service.create_lead(lead_data)
        return LeadResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create lead: {str(e)}"
        )


@router.get(
    "",
    response_model=List[LeadListResponse],
    summary="Get all leads (Admin only)",
    description="Retrieve list of all leads. Requires Prisma admin authentication."
)
async def get_leads(
    status_filter: str = "lead",
    db: Client = Depends(get_db),
    admin: dict = Depends(get_current_prisma_admin)
) -> List[LeadListResponse]:
    """
    Get list of leads (Prisma admin only).

    **Access**: Prisma admin only

    **Query Parameters**:
    - `status_filter`: Filter by subscription status (default: 'lead')

    **Returns**: List of lead records with basic information
    """
    service = LeadService(db)

    try:
        leads = await service.get_leads_list(status=status_filter)
        return [LeadListResponse(**lead) for lead in leads]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch leads: {str(e)}"
        )


@router.get(
    "/{lead_id}",
    response_model=dict,
    summary="Get lead details (Admin only)",
    description="Retrieve detailed information for a specific lead."
)
async def get_lead(
    lead_id: str,
    db: Client = Depends(get_db),
    admin: dict = Depends(get_current_prisma_admin)
) -> dict:
    """
    Get detailed lead information by ID.

    **Access**: Prisma admin only

    **Path Parameters**:
    - `lead_id`: Company UUID

    **Returns**: Complete lead/company record
    """
    service = LeadService(db)

    try:
        lead = await service.get_lead_by_id(lead_id)
        return lead

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead not found: {str(e)}"
        )
