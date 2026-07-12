"""
FastAPI dependencies shared across route handlers.
"""
import uuid

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt import decode_token
from app.core.exceptions import NotFoundError, UnauthorizedError
from app.database.session import AsyncSession, get_db
from app.models.user import User
from app.services.auth import AuthService

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise UnauthorizedError()

    user_id = decode_token(credentials.credentials)
    service = AuthService(session)
    user = await service.get_user_by_id(uuid.UUID(user_id))

    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")

    return user


# Shorter alias for routes that just want the user object
CurrentUser = Depends(get_current_user)
