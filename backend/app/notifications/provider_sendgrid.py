from dataclasses import dataclass
from typing import Optional

import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


@dataclass
class SendEmailResult:
    ok: bool
    provider_message_id: Optional[str] = None
    error: Optional[str] = None


class SendGridEmailProvider:
    def __init__(self) -> None:
        api_key = (os.getenv("SENDGRID_API_KEY") or "").strip()
        from_email = (os.getenv("FROM_EMAIL") or "").strip()

        if not api_key:
            raise RuntimeError("SENDGRID_API_KEY is missing")
        if not api_key.startswith("SG."):
            raise RuntimeError("SENDGRID_API_KEY is not a valid SendGrid API key")
        if not from_email:
            raise RuntimeError("FROM_EMAIL is missing")

        self.client = SendGridAPIClient(api_key)
        self.from_email = from_email

    def send(self, to_email: str, subject: str, html: str) -> SendEmailResult:
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html,
            )
            resp = self.client.send(message)

            # SendGrid returns headers sometimes containing message-id
            msg_id = None
            if hasattr(resp, "headers") and resp.headers:
                msg_id = resp.headers.get("X-Message-Id")

            return SendEmailResult(
                ok=200 <= resp.status_code < 300, provider_message_id=msg_id
            )
        except Exception as e:
            return SendEmailResult(ok=False, error=str(e))
