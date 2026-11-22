from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Role(StrEnum):
    CONVENER = 'CONVENER'
    SECRETARIAT = 'SECRETARIAT'
    MDA_OFFICER = 'MDA_OFFICER'
    FIELD_MONITOR = 'FIELD_MONITOR'
    ANCHOR_ENTITY = 'ANCHOR_ENTITY'
    OVERSIGHT = 'OVERSIGHT'


class Base(DeclarativeBase):
    pass


class Institution(Base):
    __tablename__ = 'institution'
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200))
    provenance: Mapped[str] = mapped_column(String(16))
    source: Mapped[dict] = mapped_column(JSONB, default=dict)


class Profile(Base):
    __tablename__ = 'profile'
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(24))
    institution_id: Mapped[UUID] = mapped_column(ForeignKey('institution.id'), index=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Directive(Base):
    __tablename__ = 'directive'
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    full_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    provenance: Mapped[str] = mapped_column(String(16))
    citations: Mapped[dict] = mapped_column(JSONB, default=dict)


class DirectiveScorecard(Base):
    __tablename__ = 'directive_scorecard'
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    directive_id: Mapped[UUID] = mapped_column(ForeignKey('directive.id', ondelete='CASCADE'), index=True)
    period: Mapped[str] = mapped_column(String(20))
    label: Mapped[str] = mapped_column(String(20))
    citation: Mapped[dict] = mapped_column(JSONB)


class MDAReport(Base):
    __tablename__ = 'mda_report'
    __table_args__ = (
        CheckConstraint("state IN ('DRAFT','SUBMITTED','AI_SUMMARISED','UNDER_REVIEW','RETURNED','ACCEPTED')", name='report_state'),
        CheckConstraint('version > 0', name='report_version'),
        CheckConstraint('is_simulated = true', name='open_report_simulated'),
    )
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    institution_id: Mapped[UUID] = mapped_column(ForeignKey('institution.id'), index=True)
    actor_id: Mapped[UUID] = mapped_column(ForeignKey('profile.id'), index=True)
    period: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(200))
    narrative: Mapped[str] = mapped_column(Text)
    review_comment: Mapped[str] = mapped_column(Text, default='')
    state: Mapped[str] = mapped_column(String(20), default='DRAFT', index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
