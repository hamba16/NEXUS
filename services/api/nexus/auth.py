from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Annotated, Protocol
from uuid import UUID

from fastapi import Depends, Header, HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from .db import Session, public_session
from .models import Profile, Role


@dataclass(frozen=True)
class Actor:
    id: UUID
    name: str
    role: Role
    institution_id: UUID


class AuthProvider(Protocol):
    async def resolve(self, actor_id: UUID, session: AsyncSession) -> Actor: ...


class OpenAuthProvider:
    async def resolve(self, actor_id: UUID, session: AsyncSession) -> Actor:
        profile = await session.scalar(select(Profile).where(Profile.id == actor_id, Profile.active.is_(True)))
        if profile is None:
            raise HTTPException(400, 'Unknown or inactive profile')
        return Actor(profile.id, profile.name, Role(profile.role), profile.institution_id)


async def resolve_actor(
    actor_id: Annotated[UUID, Header(alias='X-Actor-Id')],
    session: Annotated[AsyncSession, Depends(public_session)],
) -> Actor:
    return await OpenAuthProvider().resolve(actor_id, session)


async def actor_session(actor: Annotated[Actor, Depends(resolve_actor)]) -> AsyncIterator[AsyncSession]:
    # SET LOCAL, via parameterised set_config, expires on both commit and rollback.
    async with Session() as session, session.begin():
        await session.execute(text("SELECT set_config('app.actor_id', :actor, true), set_config('app.role', :role, true), set_config('app.mda_id', :mda, true)"), {'actor': str(actor.id), 'role': actor.role.value, 'mda': str(actor.institution_id)})
        yield session


def require_role(actor: Actor, *roles: Role) -> None:
    if actor.role not in roles:
        raise HTTPException(403, 'This profile cannot perform that action')
