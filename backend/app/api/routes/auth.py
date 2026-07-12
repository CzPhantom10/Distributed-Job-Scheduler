from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth import AuthService

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(req: RegisterRequest, session: AsyncSession = Depends(get_db)):
    service = AuthService(session)
    user = await service.register(req)
    await session.commit()
    return user


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, session: AsyncSession = Depends(get_db)):
    service = AuthService(session)
    return await service.login(req)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, session: AsyncSession = Depends(get_db)):
    service = AuthService(session)
    return await service.refresh(req.refresh_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
