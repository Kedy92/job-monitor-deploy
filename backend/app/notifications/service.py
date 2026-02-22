from typing import Optional
from fastapi import BackgroundTasks

from app.notifications.provider_sendgrid import SendGridEmailProvider, SendEmailResult


class NotificationService:
    def __init__(self) -> None:
        # Later you can switch provider by ENV if you want
        self.email_provider = SendGridEmailProvider()

    def send_match_email(
        self,
        background_tasks: BackgroundTasks,
        *,
        to_email: str,
        monitor_name: str,
        target_url: str,
        match_summary: str,
    ) -> None:
        subject = f"Job Monitor: match found for '{monitor_name}'"
        html = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Match found ✅</h2>
          <p><b>Monitor:</b> {monitor_name}</p>
          <p><b>Target:</b> <a href="{target_url}">{target_url}</a></p>
          <p><b>Summary:</b> {match_summary}</p>
          <hr />
          <p>— Job Monitor</p>
        </div>
        """

        # Run in background so your API stays fast
        background_tasks.add_task(self._send_email_task, to_email, subject, html)

    def _send_email_task(
        self, to_email: str, subject: str, html: str
    ) -> Optional[SendEmailResult]:
        result = self.email_provider.send(to_email, subject, html)

        # ✅ Here is where we will later insert DB logging:
        # create NotificationDelivery row: status, error, provider_message_id, etc.

        return result
