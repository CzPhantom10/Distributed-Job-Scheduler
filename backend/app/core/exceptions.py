from fastapi import HTTPException, status


class AppError(HTTPException):
    """Base for all application errors. Carries a machine-readable code."""

    def __init__(self, status_code: int, code: str, detail: str) -> None:
        super().__init__(status_code=status_code, detail={"code": code, "message": detail})


class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: str | None = None) -> None:
        msg = f"{resource} not found" if not resource_id else f"{resource} '{resource_id}' not found"
        super().__init__(status.HTTP_404_NOT_FOUND, "NOT_FOUND", msg)


class ConflictError(AppError):
    def __init__(self, detail: str) -> None:
        super().__init__(status.HTTP_409_CONFLICT, "CONFLICT", detail)


class UnauthorizedError(AppError):
    def __init__(self, detail: str = "Not authenticated") -> None:
        super().__init__(status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", detail)


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Insufficient permissions") -> None:
        super().__init__(status.HTTP_403_FORBIDDEN, "FORBIDDEN", detail)


class ValidationError(AppError):
    def __init__(self, detail: str) -> None:
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", detail)
