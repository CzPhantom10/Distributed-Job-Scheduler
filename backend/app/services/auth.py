import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.password import hash_password, verify_password
from app.core.exceptions import ConflictError, UnauthorizedError
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class UserRepository(BaseRepository[User]):
    model = User


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = UserRepository(session)
        self._session = session

    async def register(self, req: RegisterRequest) -> User:
        from sqlalchemy import select
        existing = (await self._session.execute(
            select(User).where(User.email == req.email)
        )).scalars().first()
        if existing:
            raise ConflictError("A user with this email already exists")

        return await self._repo.create(
            email=req.email,
            hashed_password=hash_password(req.password),
            full_name=req.full_name,
        )

    async def login(self, req: LoginRequest) -> TokenResponse:
        from sqlalchemy import select
        user = (await self._session.execute(
            select(User).where(User.email == req.email)
        )).scalars().first()

        if not user or not verify_password(req.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedError("Account is disabled")

        return self._issue_tokens(str(user.id))

    async def refresh(self, refresh_token: str) -> TokenResponse:
        subject = decode_token(refresh_token, expected_type="refresh")
        user = await self._repo.get(uuid.UUID(subject))
        if not user or not user.is_active:
            raise UnauthorizedError("User not found or inactive")
        return self._issue_tokens(subject)

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self._repo.get(user_id)

    @staticmethod
    def _issue_tokens(subject: str) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(subject),
            refresh_token=create_refresh_token(subject),
        )
