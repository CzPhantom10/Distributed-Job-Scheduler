"""
Generic async repository providing CRUD operations for any SQLAlchemy model.
Concrete repositories extend this and add model-specific query methods.
"""
from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, id: UUID) -> ModelT | None:
        return await self.session.get(self.model, id)

    async def list(
        self,
        *filters,
        offset: int = 0,
        limit: int = 50,
        order_by=None,
    ) -> tuple[list[ModelT], int]:
        """Returns (items, total_count) for pagination."""
        q = select(self.model).where(*filters)
        count_q = select(func.count()).select_from(q.subquery())

        total = (await self.session.execute(count_q)).scalar_one()

        if order_by is not None:
            q = q.order_by(order_by)
        q = q.offset(offset).limit(limit)
        items = list((await self.session.execute(q)).scalars())

        return items, total

    async def create(self, **kwargs: Any) -> ModelT:
        obj = self.model(**kwargs)
        self.session.add(obj)
        await self.session.flush()  # get DB-generated fields (e.g. id) without committing
        return obj

    async def update(self, obj: ModelT, **kwargs: Any) -> ModelT:
        for key, value in kwargs.items():
            setattr(obj, key, value)
        await self.session.flush()
        return obj

    async def delete(self, obj: ModelT) -> None:
        await self.session.delete(obj)
        await self.session.flush()
