"""Email templates for Prisma Talent Platform."""

from typing import Dict
from datetime import datetime


class EmailTemplates:
    """Centralized email template management with Prisma branding."""

    # Prisma Brand Colors
    COLORS = {
        "black": "#1a1a1a",
        "purple": "#8B5CF6",
        "cyan": "#06B6D4",
        "pink": "#EC4899",
        "white": "#FFFFFF",
        "gray_100": "#f5f5f5",
        "gray_600": "#666666",
        "gray_800": "#333333",
    }

    @staticmethod
    def _base_template(content: str) -> str:
        """Base HTML template with consistent branding."""
        return f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prisma Talent</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: {EmailTemplates.COLORS['black']};
            background-color: {EmailTemplates.COLORS['gray_100']};
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: {EmailTemplates.COLORS['white']};
        }}
        .header {{
            background-color: {EmailTemplates.COLORS['black']};
            padding: 24px;
            text-align: center;
        }}
        .logo {{
            font-size: 24px;
            font-weight: 700;
            color: {EmailTemplates.COLORS['white']};
            letter-spacing: -0.5px;
        }}
        .content {{
            padding: 40px 32px;
        }}
        h1 {{
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 16px;
            color: {EmailTemplates.COLORS['black']};
        }}
        h2 {{
            font-size: 20px;
            font-weight: 600;
            margin: 24px 0 12px;
            color: {EmailTemplates.COLORS['gray_800']};
        }}
        p {{
            font-size: 16px;
            margin-bottom: 16px;
            color: {EmailTemplates.COLORS['gray_800']};
        }}
        .cta-button {{
            display: inline-block;
            background: linear-gradient(135deg, {EmailTemplates.COLORS['purple']}, {EmailTemplates.COLORS['pink']});
            color: {EmailTemplates.COLORS['white']};
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 24px 0;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }}
        .info-box {{
            background-color: {EmailTemplates.COLORS['gray_100']};
            border-left: 4px solid {EmailTemplates.COLORS['purple']};
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }}
        .info-row {{
            margin-bottom: 8px;
        }}
        .info-label {{
            font-weight: 600;
            color: {EmailTemplates.COLORS['gray_600']};
            display: inline-block;
            min-width: 120px;
        }}
        ul {{
            margin: 16px 0;
            padding-left: 24px;
        }}
        li {{
            margin-bottom: 8px;
            color: {EmailTemplates.COLORS['gray_800']};
        }}
        .footer {{
            background-color: {EmailTemplates.COLORS['gray_100']};
            padding: 24px 32px;
            text-align: center;
            font-size: 14px;
            color: {EmailTemplates.COLORS['gray_600']};
        }}
        .footer a {{
            color: {EmailTemplates.COLORS['purple']};
            text-decoration: none;
        }}
        @media only screen and (max-width: 600px) {{
            .container {{
                width: 100% !important;
            }}
            .content {{
                padding: 24px 16px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">PRISMA TALENT</div>
        </div>
        {content}
        <div class="footer">
            <p>
                <strong>Prisma Talent</strong><br>
                Community-driven talent acquisition<br>
                Lima, Perú<br>
                <a href="mailto:hello@getprisma.io">hello@getprisma.io</a>
            </p>
            <p style="margin-top: 16px; font-size: 12px;">
                © {datetime.now().year} Prisma. Todos los derechos reservados.
            </p>
        </div>
    </div>
</body>
</html>
        """

    @classmethod
    def leader_form_request(cls, data: Dict[str, str]) -> str:
        """
        Template for business leader form request email.

        Required data:
        - leader_name: Leader's name
        - company_name: Company name
        - position_name: Position title
        - position_code: Position code for URL
        - form_url: Complete URL to business form
        """
        content = f"""
<div class="content">
    <h1>Hola {data['leader_name']},</h1>

    <p>El equipo de HR ha iniciado el proceso de apertura para la siguiente posición en <strong>{data['company_name']}</strong>:</p>

    <div class="info-box">
        <div class="info-row">
            <span class="info-label">Posición:</span>
            <span><strong>{data['position_name']}</strong></span>
        </div>
        <div class="info-row">
            <span class="info-label">Código:</span>
            <span>{data['position_code']}</span>
        </div>
    </div>

    <p><strong>Tu input es necesario para continuar.</strong></p>

    <p>Por favor completa las especificaciones técnicas y contexto del equipo para que Prisma Talent pueda generar un job description preciso y atraer a los candidatos ideales.</p>

    <a href="{data['form_url']}" class="cta-button">
        Completar Especificaciones →
    </a>

    <p style="font-size: 14px; color: {cls.COLORS['gray_600']};">
        El formulario toma aproximadamente 10 minutos en completarse.
    </p>

    <h2>¿Qué información necesitamos?</h2>
    <ul>
        <li>Contexto del equipo y modalidad de trabajo</li>
        <li>Nivel de autonomía y estilo de liderazgo</li>
        <li>KPIs de éxito y métricas clave</li>
        <li>Especificaciones técnicas del área</li>
    </ul>

    <p>Si tienes alguna pregunta, no dudes en responder este email.</p>

    <p>Saludos,<br>
    <strong>Equipo Prisma Talent</strong></p>
</div>
        """
        return cls._base_template(content)

    @classmethod
    def job_description_validation(cls, data: Dict[str, str]) -> str:
        """
        Template for HR notification after business leader completes specs.

        Required data:
        - hr_name: HR user name
        - position_name: Position title
        - position_code: Position code
        - company_name: Company name
        - leader_name: Business leader who completed form
        - admin_url: URL to admin position detail view
        """
        content = f"""
<div class="content">
    <h1>Hola {data['hr_name']},</h1>

    <p>{data['leader_name']} ha completado las especificaciones técnicas para la posición:</p>

    <div class="info-box">
        <div class="info-row">
            <span class="info-label">Posición:</span>
            <span><strong>{data['position_name']}</strong></span>
        </div>
        <div class="info-row">
            <span class="info-label">Código:</span>
            <span>{data['position_code']}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Empresa:</span>
            <span>{data['company_name']}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Completado por:</span>
            <span>{data['leader_name']}</span>
        </div>
    </div>

    <p><strong>El administrador de Prisma ahora generará el Job Description.</strong></p>

    <p>Recibirás una notificación cuando el JD esté listo para tu validación.</p>

    <a href="{data['admin_url']}" class="cta-button">
        Ver Detalles en Admin →
    </a>

    <h2>Próximos pasos</h2>
    <ul>
        <li>✅ Especificaciones completadas</li>
        <li>⏳ Generación de Job Description (Prisma)</li>
        <li>⏳ Validación de JD (HR - tú)</li>
        <li>⏳ Publicación de la posición</li>
    </ul>

    <p>Saludos,<br>
    <strong>Equipo Prisma Talent</strong></p>
</div>
        """
        return cls._base_template(content)

    @classmethod
    def applicant_status_update(cls, data: Dict[str, str]) -> str:
        """
        Template for applicant confirmation email.

        Required data:
        - applicant_name: Applicant's name
        - position_name: Position title
        - company_name: Company name
        - position_code: Position code (for reference)
        """
        content = f"""
<div class="content">
    <h1>¡Aplicación recibida!</h1>

    <p>Hola {data['applicant_name']},</p>

    <p>Hemos recibido tu aplicación para la posición de <strong>{data['position_name']}</strong> en <strong>{data['company_name']}</strong>.</p>

    <div class="info-box">
        <div class="info-row">
            <span class="info-label">Posición:</span>
            <span>{data['position_name']}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Empresa:</span>
            <span>{data['company_name']}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Código:</span>
            <span>{data['position_code']}</span>
        </div>
    </div>

    <h2>¿Qué sigue?</h2>
    <p>Nuestro equipo revisará tu perfil junto con el equipo de <strong>{data['company_name']}</strong>. Te contactaremos si tu experiencia es un match para la posición.</p>

    <ul>
        <li><strong>Revisión inicial:</strong> 3-5 días hábiles</li>
        <li><strong>Screening call:</strong> Si pasas la revisión, agendaremos una llamada de 20 minutos</li>
        <li><strong>Entrevista técnica:</strong> Con el equipo de {data['company_name']}</li>
    </ul>

    <h2>Tips mientras esperas</h2>
    <ul>
        <li>Mantén tu LinkedIn actualizado</li>
        <li>Prepara ejemplos concretos de tu trabajo</li>
        <li>Investiga sobre {data['company_name']} y su cultura</li>
    </ul>

    <p>¡Gracias por tu interés en unirte a <strong>{data['company_name']}</strong> a través de Prisma Talent!</p>

    <p>Si tienes alguna pregunta sobre el proceso, no dudes en responder este email.</p>

    <p>Saludos,<br>
    <strong>Equipo Prisma Talent</strong></p>
</div>
        """
        return cls._base_template(content)

    @classmethod
    def client_invitation(cls, data: Dict[str, str]) -> str:
        """
        Template for client invitation with magic link.

        Required data:
        - client_name: Contact name
        - company_name: Company name
        - magic_link: Supabase auth magic link URL (optional, defaults to generic portal URL)
        """
        magic_link = data.get('magic_link', '#')

        content = f"""
<div class="content">
    <h1>Bienvenido a Prisma Talent, {data['client_name']}</h1>

    <p>Tu cuenta ha sido creada exitosamente en <strong>Prisma Talent</strong> para <strong>{data['company_name']}</strong>.</p>

    <p>Haz clic en el botón de abajo para acceder a tu portal y comenzar a crear posiciones:</p>

    <a href="{magic_link}" class="cta-button">
        Acceder a Portal de Cliente →
    </a>

    <h2>¿Qué puedes hacer en tu portal?</h2>
    <ul>
        <li>Crear nuevas posiciones con nuestro asistente inteligente</li>
        <li>Revisar y validar job descriptions generados por IA</li>
        <li>Ver y gestionar candidatos en tiempo real</li>
        <li>Dar feedback directo al equipo de Prisma</li>
    </ul>

    <p><strong>Nota:</strong> Este enlace de acceso expira en 24 horas. Si necesitas un nuevo enlace, contacta a tu administrador.</p>

    <p>Si tienes alguna pregunta, no dudes en responder este email.</p>

    <p>Saludos,<br>
    <strong>Equipo Prisma Talent</strong></p>
</div>
        """
        return cls._base_template(content)

    @classmethod
    def test_email(cls, recipient_name: str) -> str:
        """Test email template for development/staging."""
        content = f"""
<div class="content">
    <h1>🧪 Email de Prueba</h1>

    <p>Hola {recipient_name},</p>

    <p>Este es un email de prueba del sistema de notificaciones de <strong>Prisma Talent</strong>.</p>

    <div class="info-box">
        <div class="info-row">
            <span class="info-label">Estado:</span>
            <span>✅ Sistema de emails funcionando correctamente</span>
        </div>
        <div class="info-row">
            <span class="info-label">Timestamp:</span>
            <span>{datetime.now().isoformat()}</span>
        </div>
    </div>

    <p>Si recibiste este email, significa que:</p>
    <ul>
        <li>✅ La integración con Resend está funcionando</li>
        <li>✅ Los templates se están renderizando correctamente</li>
        <li>✅ El email worker está operativo</li>
    </ul>

    <p>Saludos,<br>
    <strong>Equipo Prisma Talent</strong></p>
</div>
        """
        return cls._base_template(content)
