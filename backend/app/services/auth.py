from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserRead
from app.services.users import create_user, get_user_by_email


class AuthError(Exception):
    """Internal service error for auth failures."""


def register(db: Session, payload: UserCreate) -> UserRead:
    existing = get_user_by_email(db, payload.email)
    if existing:
        # We raise a service-level error; router maps it to HTTP
        raise AuthError("email_already_registered")

    user = create_user(db, payload.email, payload.password)
    return UserRead.model_validate(user)


def login(db: Session, payload: LoginRequest) -> TokenResponse:
    user = get_user_by_email(db, payload.email)
    if not user:
        raise AuthError("invalid_credentials")

    if not verify_password(payload.password, user.hashed_password):
        raise AuthError("invalid_credentials")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)
