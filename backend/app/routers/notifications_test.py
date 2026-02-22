from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/notifications-test", tags=["notifications-test"])


class TestEmailRequest(BaseModel):
    to_email: EmailStr
    subject: str = "Job Monitor test email"
    message: str = "Hello from Job Monitor!"


@router.post("/email")
def send_test_email(payload: TestEmailRequest):
    """
    TEMP test endpoint:
    - Just confirms we can hit the route and receive payload.
    - Later we will connect this to SendGrid/SMTP service.
    """
    return {
        "ok": True,
        "sent_to": payload.to_email,
        "subject": payload.subject,
        "message": payload.message,
    }
