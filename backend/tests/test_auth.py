import pytest
from app.services.auth import AuthService
from app.schemas.auth import RegisterRequest, LoginRequest
from app.auth.jwt import decode_token
from app.core.exceptions import ConflictError, UnauthorizedError

@pytest.mark.asyncio
async def test_user_registration_and_login(db_session):
    auth_service = AuthService(db_session)
    
    # 1. Register a user
    reg_req = RegisterRequest(
        email="test@example.com",
        password="securepassword123",
        full_name="John Doe"
    )
    user = await auth_service.register(reg_req)
    assert user.email == "test@example.com"
    assert user.full_name == "John Doe"
    assert user.hashed_password != "securepassword123"

    # 2. Try to register with duplicate email
    with pytest.raises(ConflictError):
        await auth_service.register(reg_req)

    # 3. Login with correct credentials
    login_req = LoginRequest(
        email="test@example.com",
        password="securepassword123"
    )
    tokens = await auth_service.login(login_req)
    assert tokens.access_token is not None
    assert tokens.refresh_token is not None
    assert tokens.token_type == "bearer"

    # 4. Verify token subject matches user ID
    user_id = decode_token(tokens.access_token)
    assert user_id == str(user.id)

    # 5. Login with invalid password
    invalid_login = LoginRequest(
        email="test@example.com",
        password="wrongpassword"
    )
    with pytest.raises(UnauthorizedError):
        await auth_service.login(invalid_login)
