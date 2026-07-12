from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import ConflictError, NotFoundError
from app.database.session import get_db
from app.models.organization import Organization
from app.models.project import Project
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.common import Paginated
from app.schemas.project import (
    CreateOrganizationRequest,
    CreateProjectRequest,
    OrganizationResponse,
    ProjectResponse,
    UpdateProjectRequest,
)

router = APIRouter()


# ── Organizations ─────────────────────────────────────────────────────────

class OrgRepo(BaseRepository[Organization]):
    model = Organization


class ProjectRepo(BaseRepository[Project]):
    model = Project


@router.post("/orgs", response_model=OrganizationResponse, status_code=201)
async def create_org(
    req: CreateOrganizationRequest,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    existing = (await session.execute(
        select(Organization).where(Organization.slug == req.slug)
    )).scalars().first()
    if existing:
        raise ConflictError(f"Organization slug '{req.slug}' is already taken")

    repo = OrgRepo(session)
    org = await repo.create(name=req.name, slug=req.slug, description=req.description)
    await session.commit()
    return org


@router.get("/orgs", response_model=Paginated[OrganizationResponse])
async def list_orgs(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    repo = OrgRepo(session)
    items, total = await repo.list(offset=offset, limit=limit, order_by=Organization.name)
    return Paginated(items=items, total=total, offset=offset, limit=limit)


# ── Projects ──────────────────────────────────────────────────────────────

@router.post("/orgs/{org_id}/projects", response_model=ProjectResponse, status_code=201)
async def create_project(
    org_id: str,
    req: CreateProjectRequest,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    import uuid
    org = await session.get(Organization, uuid.UUID(org_id))
    if not org:
        raise NotFoundError("Organization", org_id)

    existing = (await session.execute(
        select(Project).where(Project.organization_id == org.id, Project.slug == req.slug)
    )).scalars().first()
    if existing:
        raise ConflictError(f"Project slug '{req.slug}' already exists in this organization")

    repo = ProjectRepo(session)
    project = await repo.create(
        organization_id=org.id, name=req.name, slug=req.slug, description=req.description
    )
    await session.commit()
    return project


@router.get("/orgs/{org_id}/projects", response_model=Paginated[ProjectResponse])
async def list_projects(
    org_id: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = Query(None),
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    import uuid
    filters = [Project.organization_id == uuid.UUID(org_id)]
    if search:
        filters.append(Project.name.ilike(f"%{search}%"))

    repo = ProjectRepo(session)
    items, total = await repo.list(*filters, offset=offset, limit=limit, order_by=Project.name)
    return Paginated(items=items, total=total, offset=offset, limit=limit)


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    import uuid
    project = await session.get(Project, uuid.UUID(project_id))
    if not project:
        raise NotFoundError("Project", project_id)
    return project


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    req: UpdateProjectRequest,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    import uuid
    project = await session.get(Project, uuid.UUID(project_id))
    if not project:
        raise NotFoundError("Project", project_id)

    updates = req.model_dump(exclude_none=True)
    for k, v in updates.items():
        setattr(project, k, v)
    await session.commit()
    return project


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    import uuid
    project = await session.get(Project, uuid.UUID(project_id))
    if not project:
        raise NotFoundError("Project", project_id)
    await session.delete(project)
    await session.commit()
