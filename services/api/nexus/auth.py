import hmac
import secrets
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import timedelta
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .db import Session
from .models import Role
from .security import SESSION_COOKIE, csrf_token, digest, utcnow


@dataclass(frozen=True)
class Actor:
    id: UUID
    name: str
    role: Role
    institution_id: UUID
    district_ids: tuple[UUID, ...]
    directive_ids: tuple[UUID, ...]


@asynccontextmanager
async def security_transaction(token: str = ''):
    async with Session() as db, db.begin():
        await db.execute(text("SELECT set_config('app.auth_operation','1',true),set_config('app.session_token',:token,true)"), {'token': token})
        yield db


async def load_session(db: AsyncSession, token: str, *, lock: bool = False) -> dict:
    if not 32 <= len(token) <= 100:
        raise HTTPException(401, 'Sign in to continue')
    query = """SELECT s.token_hash,s.stage,s.created_at AS session_created_at,s.expires_at,s.idle_expires_at,
       a.*,p.name,p.role,p.institution_id,p.active,p.is_sample,i.name AS institution_name
       FROM auth_session s JOIN auth_account a ON a.id=s.account_id
       JOIN profile p ON p.id=a.id JOIN institution i ON i.id=p.institution_id
       WHERE s.token_hash=:token"""
    if lock:
        query += ' FOR UPDATE OF s,a'
    row = (await db.execute(text(query), {'token': digest(token)})).mappings().first()
    now = utcnow()
    if not row or not row['active'] or row['expires_at'] <= now or row['idle_expires_at'] <= now:
        raise HTTPException(401, 'Your session has expired. Sign in again.')
    if row['locked_until'] and row['locked_until'] > now:
        raise HTTPException(401, 'Sign in again after the account lock has expired.')
    if row['stage'] == 'full' and (row['must_change_password'] or not row['totp_secret']):
        raise HTTPException(401, 'Complete your account security steps.')
    return dict(row)


def require_origin(request: Request) -> None:
    if request.headers.get('origin') != get_settings().app_origin.rstrip('/'):
        raise HTTPException(403, 'The request origin is not authorised')
    if not request.headers.get('content-type', '').startswith('application/json'):
        raise HTTPException(415, 'Use application/json')


def require_csrf(request: Request, token: str) -> None:
    require_origin(request)
    if not hmac.compare_digest(request.headers.get('x-csrf-token', ''), csrf_token(token)):
        raise HTTPException(403, 'The security token expired. Reload this page and retry.')


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(SESSION_COOKIE, token, max_age=get_settings().session_absolute_hours * 3600, secure=True, httponly=True, samesite='strict', path='/')
    response.headers['Cache-Control'] = 'no-store'


async def new_session(db: AsyncSession, account_id: UUID, stage: str, old_token: str | None = None) -> str:
    now = utcnow()
    settings = get_settings()
    if old_token:
        await db.execute(text('DELETE FROM auth_session WHERE token_hash=:hash'), {'hash': digest(old_token)})
    token = secrets.token_urlsafe(32)
    absolute = now + (timedelta(hours=settings.session_absolute_hours) if stage == 'full' else timedelta(minutes=10))
    idle = min(absolute, now + timedelta(minutes=settings.session_idle_minutes))
    await db.execute(text('INSERT INTO auth_session(token_hash,account_id,stage,expires_at,idle_expires_at) VALUES(:hash,:account,:stage,:absolute,:idle)'), {'hash':digest(token),'account':account_id,'stage':stage,'absolute':absolute,'idle':idle})
    return token


async def record_event(db: AsyncSession, account_id: UUID | None, action: str, detail: dict | None = None) -> None:
    import json
    await db.execute(text('INSERT INTO security_event(account_id,action,detail) VALUES(:account,:action,CAST(:detail AS jsonb))'), {'account':account_id,'action':action,'detail':json.dumps(detail or {})})


async def fail_attempt(db: AsyncSession, account_id: UUID) -> None:
    await db.execute(text("UPDATE auth_account SET failed_attempts=failed_attempts+1,locked_until=CASE WHEN failed_attempts+1>=5 THEN now()+interval '15 minutes' ELSE locked_until END WHERE id=:id"), {'id': account_id})
    await record_event(db, account_id, 'SIGN_IN_FAILED')


async def resolve_actor(request: Request) -> Actor:
    token = request.cookies.get(SESSION_COOKIE, '')
    async with security_transaction(token) as db:
        row = await load_session(db, token)
        if row['stage'] != 'full':
            raise HTTPException(401, 'Complete password and multi-factor verification before continuing.')
        if request.method not in {'GET','HEAD','OPTIONS'}:
            require_csrf(request, token)
        await db.execute(text('UPDATE auth_session SET last_seen_at=:now,idle_expires_at=LEAST(expires_at,:idle) WHERE token_hash=:hash'), {'now':utcnow(),'idle':utcnow()+timedelta(minutes=get_settings().session_idle_minutes),'hash':digest(token)})
    request.state.session_token = token
    return Actor(row['id'], row['name'], Role(row['role']), row['institution_id'], tuple(row['district_ids']), tuple(row['directive_ids']))


async def actor_session(request: Request, actor: Annotated[Actor, Depends(resolve_actor)]) -> AsyncIterator[AsyncSession]:
    async with Session() as session, session.begin():
        await session.execute(text("SELECT set_config('app.session_token',:token,true)"), {'token': request.state.session_token})
        yield session


def require_role(actor: Actor, *roles: Role) -> None:
    if actor.role not in roles:
        raise HTTPException(403, 'Your account is not authorised for this action')
