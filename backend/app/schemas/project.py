import uuid
from datetime import datetime

from pydantic import BaseModel


class CreateOrganizationRequest(BaseModel):
    name: str
    slug: str
    description: str | None = None


class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateProjectRequest(BaseModel):
    name: str
    slug: str
    description: str | None = None


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    slug: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
