from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import UnauthorizedError

ALGORITHM = settings.algorithm


def create_access_token(subject: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expires, "type": "access"}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def create_refresh_token(subject: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {"sub": subject, "exp": expires, "type": "refresh"}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str, expected_type: str = "access") -> str:
    """Returns the subject (user id) or raises UnauthorizedError."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")

    if payload.get("type") != expected_type:
        raise UnauthorizedError(f"Expected {expected_type} token")

    subject: str | None = payload.get("sub")
    if not subject:
        raise UnauthorizedError("Token missing subject")

    return subject
