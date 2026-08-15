from email.message import EmailMessage
from email.utils import make_msgid
import os
import smtplib
import ssl

from app.notifications.provider_sendgrid import SendEmailResult


class SMTPEmailProvider:
    def __init__(self) -> None:
        self.host = (os.getenv("SMTP_HOST") or "").strip()
        self.port = int((os.getenv("SMTP_PORT") or "587").strip())
        self.username = (os.getenv("SMTP_USERNAME") or "").strip()
        self.password = (os.getenv("SMTP_PASSWORD") or "").strip()
        self.from_email = (os.getenv("FROM_EMAIL") or self.username).strip()
        self.use_tls = (os.getenv("SMTP_USE_TLS") or "true").strip().lower() == "true"
        self.use_ssl = (os.getenv("SMTP_USE_SSL") or "false").strip().lower() == "true"

        if not self.host:
            raise RuntimeError("SMTP_HOST is missing")
        if not self.username:
            raise RuntimeError("SMTP_USERNAME is missing")
        if not self.password:
            raise RuntimeError("SMTP_PASSWORD is missing")
        if not self.from_email:
            raise RuntimeError("FROM_EMAIL is missing")

    def send(self, to_email: str, subject: str, html: str) -> SendEmailResult:
        message_id = make_msgid(domain="jobmonitor.online")
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = self.from_email
        msg["To"] = to_email
        msg["Message-ID"] = message_id
        msg.set_content(_html_to_text(html))
        msg.add_alternative(html, subtype="html")

        try:
            if self.use_ssl:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(self.host, self.port, context=context, timeout=15) as server:
                    server.login(self.username, self.password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(self.host, self.port, timeout=15) as server:
                    server.ehlo()
                    if self.use_tls:
                        server.starttls(context=ssl.create_default_context())
                        server.ehlo()
                    server.login(self.username, self.password)
                    server.send_message(msg)

            return SendEmailResult(ok=True, provider_message_id=message_id)
        except Exception as exc:
            return SendEmailResult(ok=False, error=str(exc))


def _html_to_text(html: str) -> str:
    return (
        html.replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("<br />", "\n")
        .replace("</p>", "\n")
        .replace("</h2>", "\n")
        .replace("</div>", "\n")
        .replace("<hr style=\"border: none; border-top: 1px solid #e2e8f0;\" />", "\n")
        .replace("—", "-")
    )
