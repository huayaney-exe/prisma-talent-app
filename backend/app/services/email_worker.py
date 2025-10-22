"""Email worker for processing pending email communications.

Background service that polls email_communications table and sends emails via Resend.
Implements exponential backoff retry logic and dead letter queue for failed emails.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from uuid import UUID

from supabase import Client

from app.core.config import settings
from app.core.database import get_supabase_client
from app.services.email_service import EmailService
from app.services.email_templates import EmailTemplates

logger = logging.getLogger(__name__)


class EmailWorker:
    """Background worker for processing and sending emails."""

    def __init__(self):
        self.running = False
        self.poll_interval = 30  # seconds
        self.email_service = EmailService()
        self.supabase: Optional[Client] = None

        # Retry configuration (exponential backoff)
        self.retry_delays = [60, 300, 900]  # 1min, 5min, 15min in seconds
        self.max_retries = 3

    async def start(self):
        """Start the email worker background process."""
        logger.info("🚀 Starting email worker...")
        self.running = True
        self.supabase = get_supabase_client()

        try:
            while self.running:
                await self.process_pending_emails()
                await asyncio.sleep(self.poll_interval)
        except Exception as e:
            logger.error(f"❌ Email worker crashed: {e}")
            raise
        finally:
            logger.info("🛑 Email worker stopped")

    async def stop(self):
        """Stop the email worker gracefully."""
        logger.info("🛑 Stopping email worker...")
        self.running = False

    async def process_pending_emails(self):
        """
        Poll database and process pending emails.

        Query logic:
        1. sent_at IS NULL (not yet sent)
        2. retry_count < max_retries (not exhausted)
        3. next_retry_at IS NULL OR next_retry_at <= NOW (ready for retry)
        """
        try:
            # Query pending emails
            response = self.supabase.table("email_communications") \
                .select("*") \
                .is_("sent_at", "null") \
                .lt("retry_count", self.max_retries) \
                .or_("next_retry_at.is.null,next_retry_at.lte." + datetime.utcnow().isoformat()) \
                .order("created_at", desc=False) \
                .limit(50) \
                .execute()

            pending_emails = response.data

            if not pending_emails:
                logger.debug("✅ No pending emails to process")
                return

            logger.info(f"📧 Processing {len(pending_emails)} pending emails")

            for email_record in pending_emails:
                await self.send_email(email_record)

        except Exception as e:
            logger.error(f"❌ Error processing pending emails: {e}")

    async def send_email(self, email_record: Dict):
        """
        Send a single email and update database.

        Args:
            email_record: Email communication record from database
        """
        email_id = email_record["id"]
        email_type = email_record["email_type"]
        retry_count = email_record.get("retry_count", 0)

        try:
            logger.info(f"📤 Sending {email_type} email to {email_record['recipient_email']} (attempt {retry_count + 1})")

            # Render template based on email_type
            html_content = await self.render_template(email_record)

            # Send via Resend
            result = await self.email_service.send_email(
                to_email=email_record["recipient_email"],
                to_name=email_record.get("recipient_name", ""),
                subject=email_record["subject_line"],
                html_content=html_content,
                reply_to=email_record.get("reply_to_email")
            )

            # Update database - email sent successfully
            self.supabase.table("email_communications") \
                .update({
                    "sent_at": datetime.utcnow().isoformat(),
                    "resend_email_id": result.get("email_id"),
                    "status": "sent",
                    "error_message": None,
                    "next_retry_at": None
                }) \
                .eq("id", email_id) \
                .execute()

            logger.info(f"✅ Successfully sent {email_type} email (ID: {email_id})")

        except Exception as e:
            logger.error(f"❌ Failed to send email {email_id}: {e}")
            await self.handle_send_failure(email_id, retry_count, str(e))

    async def render_template(self, email_record: Dict) -> str:
        """
        Render email template based on email_type.

        Args:
            email_record: Email communication record with template data

        Returns:
            Rendered HTML content
        """
        email_type = email_record["email_type"]
        template_data = email_record.get("template_data", {})

        # Map email_type to template method
        template_map = {
            "leader_form_request": EmailTemplates.leader_form_request,
            "job_description_validation": EmailTemplates.job_description_validation,
            "applicant_status_update": EmailTemplates.applicant_status_update,
            "client_invitation": EmailTemplates.client_invitation,
        }

        template_method = template_map.get(email_type)

        if not template_method:
            logger.error(f"❌ Unknown email_type: {email_type}")
            raise ValueError(f"Unknown email_type: {email_type}")

        # Render template with data
        try:
            html_content = template_method(template_data)
            return html_content
        except Exception as e:
            logger.error(f"❌ Template rendering failed for {email_type}: {e}")
            raise

    async def handle_send_failure(self, email_id: str, retry_count: int, error_message: str):
        """
        Handle email send failure with exponential backoff retry logic.

        Args:
            email_id: Email communication ID
            retry_count: Current retry count
            error_message: Error description
        """
        new_retry_count = retry_count + 1

        # Check if we've exhausted retries
        if new_retry_count >= self.max_retries:
            logger.warning(f"⚠️ Email {email_id} moved to dead letter queue after {self.max_retries} attempts")

            # Move to dead letter queue
            self.supabase.table("email_communications") \
                .update({
                    "status": "failed",
                    "retry_count": new_retry_count,
                    "error_message": error_message,
                    "failed_at": datetime.utcnow().isoformat(),
                    "next_retry_at": None
                }) \
                .eq("id", email_id) \
                .execute()

            return

        # Calculate next retry time with exponential backoff
        retry_delay = self.retry_delays[new_retry_count - 1]
        next_retry_at = datetime.utcnow() + timedelta(seconds=retry_delay)

        logger.info(f"🔄 Scheduling retry {new_retry_count}/{self.max_retries} for email {email_id} at {next_retry_at}")

        # Update retry metadata
        self.supabase.table("email_communications") \
            .update({
                "retry_count": new_retry_count,
                "error_message": error_message,
                "next_retry_at": next_retry_at.isoformat(),
                "status": "retry_scheduled"
            }) \
            .eq("id", email_id) \
            .execute()

    async def get_worker_health(self) -> Dict:
        """
        Get worker health status and metrics.

        Returns:
            Health status dictionary
        """
        try:
            # Query email statistics
            total_pending = self.supabase.table("email_communications") \
                .select("id", count="exact") \
                .is_("sent_at", "null") \
                .lt("retry_count", self.max_retries) \
                .execute()

            total_failed = self.supabase.table("email_communications") \
                .select("id", count="exact") \
                .eq("status", "failed") \
                .execute()

            total_sent_today = self.supabase.table("email_communications") \
                .select("id", count="exact") \
                .gte("sent_at", datetime.utcnow().date().isoformat()) \
                .execute()

            return {
                "status": "healthy" if self.running else "stopped",
                "running": self.running,
                "poll_interval_seconds": self.poll_interval,
                "metrics": {
                    "pending_emails": total_pending.count or 0,
                    "failed_emails": total_failed.count or 0,
                    "sent_today": total_sent_today.count or 0
                },
                "retry_config": {
                    "max_retries": self.max_retries,
                    "retry_delays_seconds": self.retry_delays
                }
            }

        except Exception as e:
            logger.error(f"❌ Error getting worker health: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }


# Global worker instance
email_worker = EmailWorker()


async def start_email_worker():
    """Start the email worker in background."""
    await email_worker.start()


async def stop_email_worker():
    """Stop the email worker gracefully."""
    await email_worker.stop()


async def get_email_worker_health() -> Dict:
    """Get email worker health status."""
    return await email_worker.get_worker_health()
