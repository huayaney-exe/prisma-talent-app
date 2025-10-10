"""Email service using Resend API."""

from typing import Dict, Optional
import resend
from app.core.config import settings


class EmailService:
    """Service for sending emails via Resend."""

    def __init__(self) -> None:
        """Initialize Resend client."""
        resend.api_key = settings.resend_api_key

    async def send_email(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        html_content: str,
        reply_to: Optional[str] = None
    ) -> Dict:
        """
        Send email using Resend API.

        Args:
            to_email: Recipient email address
            to_name: Recipient name
            subject: Email subject
            html_content: HTML email body
            reply_to: Optional reply-to address

        Returns:
            Dict with email_id and status

        Raises:
            Exception: If email sending fails
        """
        try:
            params = {
                "from": f"Prisma Talent <{settings.from_email}>",
                "to": [f"{to_name} <{to_email}>"],
                "subject": subject,
                "html": html_content,
                "reply_to": reply_to or settings.reply_to_email
            }

            response = resend.Emails.send(params)

            return {
                "email_id": response["id"],
                "status": "sent"
            }

        except Exception as e:
            # Log error (in production, use proper logging)
            print(f"❌ Email send failed: {str(e)}")
            raise Exception(f"Failed to send email: {str(e)}")

    async def send_lead_confirmation(
        self,
        to_email: str,
        to_name: str,
        company_name: str
    ) -> Dict:
        """
        Send confirmation email to lead after form submission.

        Args:
            to_email: Lead email
            to_name: Lead name
            company_name: Company name

        Returns:
            Email send result
        """
        subject = "Solicitud recibida - Prisma Talent"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Inter', -apple-system, sans-serif; color: #1a1a1a; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                .logo {{ margin-bottom: 32px; }}
                h1 {{ font-size: 24px; font-weight: 600; margin-bottom: 16px; }}
                p {{ font-size: 16px; line-height: 1.6; margin-bottom: 16px; }}
                .cta {{
                    display: inline-block;
                    background: #1a1a1a;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 24px 0;
                }}
                .footer {{
                    margin-top: 48px;
                    padding-top: 24px;
                    border-top: 1px solid #e5e5e5;
                    font-size: 14px;
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <strong>Prisma Talent</strong>
                </div>

                <h1>Hola {to_name},</h1>

                <p>Gracias por tu interés en <strong>Prisma Talent</strong> para {company_name}.</p>

                <p>Hemos recibido tu solicitud y un miembro de nuestro equipo te contactará en las próximas <strong>24 horas</strong> para agendar una llamada de 15 minutos.</p>

                <p><strong>¿Qué sigue?</strong></p>
                <ul>
                    <li>Revisaremos tu información</li>
                    <li>Te contactaremos para entender mejor tus necesidades</li>
                    <li>Discutiremos cómo Prisma Talent puede ayudarte</li>
                </ul>

                <p>Mientras tanto, si tienes alguna pregunta, no dudes en responder este email.</p>

                <div class="footer">
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

        return await self.send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )

    async def send_admin_lead_notification(
        self,
        lead_data: Dict
    ) -> Dict:
        """
        Send notification to Prisma admin about new lead.

        Args:
            lead_data: Lead information

        Returns:
            Email send result
        """
        subject = f"🎯 Nuevo Lead: {lead_data['company_name']}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Inter', -apple-system, monospace; color: #1a1a1a; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
                .info-grid {{
                    background: #f5f5f5;
                    padding: 24px;
                    border-radius: 8px;
                    margin: 24px 0;
                }}
                .info-row {{
                    margin-bottom: 12px;
                    display: flex;
                }}
                .info-label {{
                    font-weight: 600;
                    min-width: 150px;
                }}
                .cta {{
                    display: inline-block;
                    background: #1a1a1a;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 24px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎯 Nuevo Lead Registrado</h1>

                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">Empresa:</span>
                        <span>{lead_data['company_name']}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Contacto:</span>
                        <span>{lead_data['contact_name']} ({lead_data['position']})</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span><a href="mailto:{lead_data['contact_email']}">{lead_data['contact_email']}</a></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Teléfono:</span>
                        <span>{lead_data['contact_phone']}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Intención:</span>
                        <span>{lead_data['intent']}</span>
                    </div>
                </div>

                <a href="{settings.admin_dashboard_url}/leads/{lead_data['id']}" class="cta">
                    Ver en Dashboard →
                </a>

                <p><strong>Siguiente paso:</strong> Contactar dentro de 24 horas</p>
            </div>
        </body>
        </html>
        """

        return await self.send_email(
            to_email=settings.default_admin_email,
            to_name="Prisma Admin",
            subject=subject,
            html_content=html_content
        )
