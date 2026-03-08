from typing import Optional
from fastapi import BackgroundTasks

from app.notifications.provider_sendgrid import SendGridEmailProvider, SendEmailResult


class NotificationService:
    def __init__(self) -> None:
        self.email_provider = SendGridEmailProvider()

    def _build_html(self, monitor_name: str, target_url: str, match_summary: str) -> tuple[str, str]:
        subject = f"Job Monitor: match found for '{monitor_name}'"
        html = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px;">
          <h2 style="color: #4f46e5;">Match found ✅</h2>
          <p><b>Monitor:</b> {monitor_name}</p>
          <p><b>Target:</b> <a href="{target_url}" style="color: #4f46e5;">{target_url}</a></p>
          <p><b>Summary:</b> {match_summary}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0;" />
          <p style="color: #94a3b8; font-size: 12px;">— Job Monitor</p>
        </div>
        """
        return subject, html

    def send_match_email(
        self,
        background_tasks: BackgroundTasks,
        *,
        to_email: str,
        monitor_name: str,
        target_url: str,
        match_summary: str,
    ) -> None:
        """Send via FastAPI BackgroundTasks (for use in API routes)."""
        subject, html = self._build_html(monitor_name, target_url, match_summary)
        background_tasks.add_task(self._send_email_task, to_email, subject, html)

    def send_match_email_direct(
        self,
        *,
        to_email: str,
        monitor_name: str,
        target_url: str,
        match_summary: str,
    ) -> Optional[SendEmailResult]:
        """Send synchronously (for use in the scheduler worker)."""
        subject, html = self._build_html(monitor_name, target_url, match_summary)
        return self._send_email_task(to_email, subject, html)

    def _send_email_task(
        self, to_email: str, subject: str, html: str
    ) -> Optional[SendEmailResult]:
        return self.email_provider.send(to_email, subject, html)
