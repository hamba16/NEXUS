from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from .models import Role


class ProfileOut(BaseModel):
    id: UUID
    name: str
    role: Role
    institution_id: UUID
    institution_name: str
    is_sample: bool = False


class ReportCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    title: str = Field(min_length=5, max_length=200)
    period: str = Field(pattern=r'^FY20\d{2}/\d{2} Q[1-4]$')
    narrative: str = Field(min_length=20, max_length=20000)
    directive_id: UUID
    district_id: UUID | None = None


class ReportOut(ReportCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    institution_id: UUID
    actor_id: UUID
    state: Literal['DRAFT', 'SUBMITTED', 'AI_SUMMARISED', 'UNDER_REVIEW', 'RETURNED', 'ACCEPTED']
    version: int
    is_sample: bool
    review_comment: str
    created_at: datetime
    updated_at: datetime


class ReportEdit(ReportCreate):
    version: int = Field(ge=1)


class PublicContextPackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    version: str
    as_of: str
    meta: dict


class PublicContextRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    section: str
    slug: str
    payload: dict
    provenance: str
    source_ids: list[str]
    as_of: str | None = None
    reverify: bool


class DirectiveOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    number: int = Field(ge=1, le=23)
    title: str | None = None
    full_text: str | None = None
    provenance: Literal['published', 'unverified']


class Transition(BaseModel):
    model_config = ConfigDict(extra='forbid')
    version: int = Field(ge=1)
    action: Literal['submit', 'review', 'accept', 'return']
    comment: str = Field(default='', max_length=4000)
