from typing import Generic, TypeVar

from pydantic import BaseModel

DataT = TypeVar("DataT")


class Paginated(BaseModel, Generic[DataT]):
    """Standard paginated response wrapper used by all list endpoints."""
    items: list[DataT]
    total: int
    offset: int
    limit: int

    @property
    def has_more(self) -> bool:
        return self.offset + self.limit < self.total


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    detail: ErrorDetail
