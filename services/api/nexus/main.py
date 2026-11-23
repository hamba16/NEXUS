import json
import logging
import time
from collections import OrderedDict, deque
from contextlib import asynccontextmanager
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import Actor, actor_session, require_role, resolve_actor
from .config import get_settings
from .contracts import DirectiveOut, ReportCreate, ReportEdit, ReportOut, Transition
from .db import check_database_role, engine, public_session
from .domain import transition
from .models import Directive, MDAReport, Role

settings = get_settings()
logger = logging.getLogger('nexus')
logging.basicConfig(level=logging.INFO, format='%(message)s')


@asynccontextmanager
async def lifespan(_: FastAPI):
    await check_database_role()
    yield
    await engine.dispose()


app = FastAPI(title='APEX NEXUS API', version='0.1.0', lifespan=lifespan, description='Executive Oversight Platform', docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=['GET', 'POST', 'PATCH'], allow_headers=['Content-Type', 'X-Actor-Id', 'X-Request-Id'], expose_headers=['X-Request-Id'])
request_windows: OrderedDict[str, deque[float]] = OrderedDict()
request_count = 0


@app.middleware('http')
async def observe(request: Request, call_next):
    global request_count
    if request.url.path != '/healthz':
        return Response(content='{"detail":"Sign in to continue"}', status_code=401, media_type='application/json', headers={'Cache-Control':'no-store'})
    started = time.monotonic()
    request_id = str(uuid4())
    key = request.client.host if request.client else 'unknown'
    window = request_windows.setdefault(key, deque())
    request_windows.move_to_end(key)
    while window and window[0] < started - 60:
        window.popleft()
    if len(request_windows) > 10000:
        request_windows.popitem(last=False)
    if request.url.path not in {'/healthz'} and len(window) >= settings.request_limit_per_minute:
        return Response(status_code=429, headers={'Retry-After': '60', 'X-Request-Id': request_id})
    window.append(started)
    request_count += 1
    response = await call_next(request)
    response.headers.update({'X-Request-Id': request_id, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store'})
    logger.info(json.dumps({'request_id': request_id, 'method': request.method, 'path': request.url.path, 'status': response.status_code, 'duration_ms': round((time.monotonic() - started) * 1000, 2)}))
    return response


@app.get('/healthz')
async def healthz() -> dict:
    return {'status': 'ok'}
















@app.get('/directives', response_model=list[DirectiveOut])
async def directives(session: Annotated[AsyncSession, Depends(public_session)]):
    rows = await session.scalars(select(Directive).order_by(Directive.number))
    return list(rows)




@app.get('/me')
async def me(actor: Annotated[Actor, Depends(resolve_actor)]) -> Actor:
    return actor


DB = Annotated[AsyncSession, Depends(actor_session, scope='function')]
CurrentActor = Annotated[Actor, Depends(resolve_actor)]


@app.get('/reports', response_model=list[ReportOut])
async def reports(session: DB, actor: CurrentActor, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)):
    require_role(actor, Role.MDA_OFFICER, Role.SECRETARIAT, Role.ANCHOR_ENTITY)
    return list(await session.scalars(select(MDAReport).order_by(MDAReport.created_at.desc(), MDAReport.id).limit(limit).offset(offset)))


@app.post('/reports', response_model=ReportOut, status_code=201)
async def create_report(body: ReportCreate, session: DB, actor: CurrentActor):
    require_role(actor, Role.MDA_OFFICER)
    if settings.data_mode == 'clean':
        raise HTTPException(409, 'This organisation does not permit sample records')
    report = MDAReport(**body.model_dump(), actor_id=actor.id, institution_id=actor.institution_id, is_simulated=True)
    session.add(report)
    await session.flush()
    await session.refresh(report)
    return report


async def locked_report(session: AsyncSession, report_id: UUID, version: int) -> MDAReport:
    report = await session.scalar(select(MDAReport).where(MDAReport.id == report_id).with_for_update())
    if report is None:
        raise HTTPException(404, 'Report not found')
    if report.version != version:
        raise HTTPException(409, 'This report changed. Reload before editing.')
    return report


@app.patch('/reports/{report_id}', response_model=ReportOut)
async def edit_report(report_id: UUID, body: ReportEdit, session: DB, actor: CurrentActor):
    require_role(actor, Role.MDA_OFFICER)
    report = await locked_report(session, report_id, body.version)
    if report.state not in {'DRAFT', 'RETURNED'}:
        raise HTTPException(409, 'Only draft or returned reports can be edited')
    report.title, report.period, report.narrative = body.title, body.period, body.narrative
    report.version += 1
    await session.flush()
    await session.refresh(report)
    return report


@app.post('/reports/{report_id}/transition', response_model=ReportOut)
async def report_transition(report_id: UUID, body: Transition, session: DB, actor: CurrentActor):
    require_role(actor, Role.MDA_OFFICER, Role.SECRETARIAT)
    report = await locked_report(session, report_id, body.version)
    if body.action == 'return' and not body.comment.strip():
        raise HTTPException(422, 'Explain the changes required before returning a report')
    try:
        report.state = transition(report.state, body.action, actor.role)
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc
    if actor.role == Role.SECRETARIAT:
        report.review_comment = body.comment
    report.version += 1
    await session.flush()
    await session.refresh(report)
    return report


@app.get('/audit')
async def audit(session: DB, actor: CurrentActor, limit: int = Query(50, ge=1, le=100)) -> list[dict]:
    require_role(actor, Role.SECRETARIAT, Role.OVERSIGHT)
    rows = await session.execute(text('SELECT id, actor_id, action, record_id, created_at, previous_hash, event_hash, is_simulated FROM audit_event ORDER BY id DESC LIMIT :limit'), {'limit': limit})
    return [dict(row) for row in rows.mappings()]
