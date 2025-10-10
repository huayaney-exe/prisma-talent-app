"""Client enrollment business logic."""

from typing import Dict
import secrets
from datetime import datetime
from supabase import Client
from app.models.enrollment import ClientEnrollmentCreate
from app.services.email_service import EmailService
from app.core.config import settings


class EnrollmentService:
    """Service for client enrollment operations."""

    def __init__(self, db: Client):
        """Initialize enrollment service."""
        self.db = db
        self.email_service = EmailService()

    async def enroll_client(
        self,
        enrollment_data: ClientEnrollmentCreate,
        enrolled_by_admin_id: str
    ) -> Dict:
        """
        Enroll new client company (Prisma admin only).

        Workflow:
        1. Create or update company record (lead → trial)
        2. Create HR user with invitation token
        3. Send onboarding email to HR user
        4. Update company onboarding status

        Args:
            enrollment_data: Client enrollment data
            enrolled_by_admin_id: Prisma admin ID performing enrollment

        Returns:
            Dict with company_id, hr_user_id, invitation_token

        Raises:
            Exception: If enrollment fails
        """
        try:
            # Check if company already exists
            existing_company = self.db.table("companies").select("id").eq(
                "company_domain", enrollment_data.company_domain
            ).execute()

            if existing_company.data:
                # Update existing company
                company_id = existing_company.data[0]["id"]

                self.db.table("companies").update({
                    "subscription_status": "trial",
                    "subscription_plan": enrollment_data.subscription_plan,
                    "enrolled_by": enrolled_by_admin_id,
                    "company_name": enrollment_data.company_name,
                    "industry": enrollment_data.industry,
                    "company_size": enrollment_data.company_size,
                    "website_url": enrollment_data.website_url,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("id", company_id).execute()

            else:
                # Create new company
                company_result = self.db.table("companies").insert({
                    "company_name": enrollment_data.company_name,
                    "company_domain": enrollment_data.company_domain,
                    "industry": enrollment_data.industry,
                    "company_size": enrollment_data.company_size,
                    "website_url": enrollment_data.website_url,
                    "subscription_status": "trial",
                    "subscription_plan": enrollment_data.subscription_plan,
                    "primary_contact_name": enrollment_data.hr_full_name,
                    "primary_contact_email": enrollment_data.hr_email,
                    "enrolled_by": enrolled_by_admin_id,
                    "created_by": enrolled_by_admin_id
                }).execute()

                if not company_result.data:
                    raise Exception("Failed to create company")

                company_id = company_result.data[0]["id"]

            # Generate invitation token
            invitation_token = secrets.token_urlsafe(32)

            # Create HR user
            hr_user_result = self.db.table("hr_users").insert({
                "company_id": company_id,
                "email": enrollment_data.hr_email,
                "full_name": enrollment_data.hr_full_name,
                "position_title": enrollment_data.hr_position,
                "phone": enrollment_data.hr_phone,
                "role": "company_admin",
                "is_active": True,
                "can_create_positions": True,
                "can_manage_team": True,
                "can_view_analytics": True,
                "invitation_token": invitation_token,
                "created_by": enrolled_by_admin_id
            }).execute()

            if not hr_user_result.data:
                raise Exception("Failed to create HR user")

            hr_user_id = hr_user_result.data[0]["id"]

            # Send onboarding email
            try:
                await self._send_onboarding_email(
                    company_name=enrollment_data.company_name,
                    hr_email=enrollment_data.hr_email,
                    hr_name=enrollment_data.hr_full_name,
                    invitation_token=invitation_token
                )
            except Exception as e:
                print(f"⚠️ Onboarding email failed: {str(e)}")

            return {
                "company_id": company_id,
                "hr_user_id": hr_user_id,
                "invitation_token": invitation_token,
                "message": "Client enrolled successfully",
                "next_steps": "HR user will receive onboarding email with platform access"
            }

        except Exception as e:
            raise Exception(f"Client enrollment failed: {str(e)}")

    async def _send_onboarding_email(
        self,
        company_name: str,
        hr_email: str,
        hr_name: str,
        invitation_token: str
    ) -> None:
        """Send onboarding email to new HR user."""
        subject = f"Bienvenido a Prisma Talent - {company_name}"

        # Onboarding URL with invitation token
        onboarding_url = f"{settings.client_portal_url}/onboarding?token={invitation_token}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Inter', -apple-system, sans-serif; color: #1a1a1a; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                h1 {{ font-size: 24px; font-weight: 600; margin-bottom: 16px; }}
                p {{ font-size: 16px; line-height: 1.6; margin-bottom: 16px; }}
                .cta {{
                    display: inline-block;
                    background: #1a1a1a;
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 24px 0;
                    font-weight: 600;
                }}
                .info-box {{
                    background: #f5f5f5;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 24px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Bienvenido a Prisma Talent, {hr_name}</h1>

                <p>Tu empresa <strong>{company_name}</strong> ha sido inscrita en Prisma Talent.</p>

                <p>Prisma Talent es la plataforma de <strong>community-driven talent acquisition</strong>
                más curada de Latinoamérica, con acceso a +2500 profesionales verificados en Product,
                Growth, Design y Tech.</p>

                <div class="info-box">
                    <p><strong>¿Qué sigue?</strong></p>
                    <ol>
                        <li>Completa tu onboarding y crea tu contraseña</li>
                        <li>Inicia tu primera búsqueda de talento</li>
                        <li>Agrega el líder de negocio que completará las especificaciones</li>
                        <li>Prisma se encargará del resto</li>
                    </ol>
                </div>

                <a href="{onboarding_url}" class="cta">
                    Completar Onboarding →
                </a>

                <p>Este enlace expira en 7 días. Si tienes alguna pregunta, responde este email.</p>

                <p>¡Bienvenido a la comunidad!</p>

                <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666;">
                    <p>
                        <strong>Prisma Talent</strong><br>
                        Community-driven talent acquisition<br>
                        Lima, Perú<br>
                        <a href="mailto:hello@getprisma.io">hello@getprisma.io</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        await self.email_service.send_email(
            to_email=hr_email,
            to_name=hr_name,
            subject=subject,
            html_content=html_content
        )
