"""Lead management business logic."""

from typing import Dict, List
from datetime import datetime
from supabase import Client
from app.models.lead import LeadCreate
from app.services.email_service import EmailService


class LeadService:
    """Service for lead management operations."""

    def __init__(self, db: Client):
        """Initialize lead service with database client."""
        self.db = db
        self.email_service = EmailService()

    async def create_lead(self, lead_data: LeadCreate) -> Dict:
        """
        Process new lead submission from landing page.

        Workflow:
        1. Create company record (status: 'lead')
        2. Send confirmation email to lead
        3. Send notification to Prisma admin
        4. Log activity

        Args:
            lead_data: Validated lead form data

        Returns:
            Dict with lead_id, company_id, and next steps

        Raises:
            Exception: If lead creation fails
        """
        try:
            # Generate company domain from email
            email_domain = lead_data.contact_email.split("@")[1]

            # Create company record
            company_result = self.db.table("companies").insert({
                "company_name": lead_data.company_name,
                "company_domain": email_domain,
                "primary_contact_name": lead_data.contact_name,
                "primary_contact_email": lead_data.contact_email,
                "primary_contact_phone": lead_data.contact_phone,
                "primary_contact_position": lead_data.position,
                "subscription_status": "lead",
                "lead_source": "landing_page",
                "lead_submitted_at": datetime.utcnow().isoformat(),
                "onboarding_completed": False
            }).execute()

            if not company_result.data:
                raise Exception("Failed to create company record")

            company = company_result.data[0]
            company_id = company["id"]

            # Store position details if intent is hiring
            if lead_data.intent == "hiring" and lead_data.role_title:
                # Store as JSON metadata for future reference
                position_metadata = {
                    "role_title": lead_data.role_title,
                    "role_type": lead_data.role_type,
                    "level": lead_data.level,
                    "work_mode": lead_data.work_mode,
                    "urgency": lead_data.urgency
                }

                # Update company with position metadata
                self.db.table("companies").update({
                    "company_description": f"Initial interest: {lead_data.role_title}"
                }).eq("id", company_id).execute()

            # Send confirmation email to lead
            try:
                await self.email_service.send_lead_confirmation(
                    to_email=lead_data.contact_email,
                    to_name=lead_data.contact_name,
                    company_name=lead_data.company_name
                )
            except Exception as e:
                print(f"⚠️ Lead confirmation email failed: {str(e)}")
                # Don't fail the whole operation if email fails

            # Send notification to Prisma admin
            try:
                lead_notification_data = {
                    "id": company_id,
                    "company_name": lead_data.company_name,
                    "contact_name": lead_data.contact_name,
                    "position": lead_data.position,
                    "contact_email": lead_data.contact_email,
                    "contact_phone": lead_data.contact_phone,
                    "intent": lead_data.intent
                }
                await self.email_service.send_admin_lead_notification(lead_notification_data)
            except Exception as e:
                print(f"⚠️ Admin notification email failed: {str(e)}")

            return {
                "id": company_id,
                "company_id": company_id,
                "message": "Lead submitted successfully",
                "next_steps": "We'll contact you within 24 hours to schedule a 15-minute call"
            }

        except Exception as e:
            raise Exception(f"Lead creation failed: {str(e)}")

    async def get_leads_list(self, status: str = "lead") -> List[Dict]:
        """
        Get list of leads (Prisma admin only).

        Args:
            status: Filter by subscription status (default: 'lead')

        Returns:
            List of lead records
        """
        try:
            result = self.db.table("companies").select(
                "id, company_name, primary_contact_name, primary_contact_email, "
                "subscription_status, lead_submitted_at"
            ).eq("subscription_status", status).order(
                "lead_submitted_at", desc=True
            ).execute()

            return result.data if result.data else []

        except Exception as e:
            raise Exception(f"Failed to fetch leads: {str(e)}")

    async def get_lead_by_id(self, lead_id: str) -> Dict:
        """
        Get detailed lead information by ID.

        Args:
            lead_id: Company UUID

        Returns:
            Lead details
        """
        try:
            result = self.db.table("companies").select("*").eq(
                "id", lead_id
            ).single().execute()

            if not result.data:
                raise Exception("Lead not found")

            return result.data

        except Exception as e:
            raise Exception(f"Failed to fetch lead: {str(e)}")
