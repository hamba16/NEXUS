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

from .accounts import router as accounts_router
from .auth import Actor, actor_session, load_session, require_csrf, require_role, resolve_actor, security_transaction
from .config import get_settings
from .contracts import DirectiveOut, ReportCreate, ReportEdit, ReportOut, Transition
from .db import check_database_role, engine
from .domain import transition
from .models import Directive, MDAReport, Role
from .security import SESSION_COOKIE

settings = get_settings()
logger = logging.getLogger('nexus')
logging.basicConfig(level=logging.INFO, format='%(message)s')


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate_auth_keys()
    await check_database_role()
    yield
    await engine.dispose()


app = FastAPI(title='APEX NEXUS API', version='0.1.0', lifespan=lifespan, description='Executive Oversight Platform', docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(accounts_router)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=['GET', 'POST', 'PATCH'], allow_headers=['Content-Type', 'X-Actor-Id', 'X-Request-Id'], expose_headers=['X-Request-Id'])
request_windows: OrderedDict[str, deque[float]] = OrderedDict()
request_count = 0


@app.middleware('http')
async def observe(request: Request, call_next):
    global request_count
    if request.url.path not in {'/healthz','/auth/csrf','/auth/login'}:
        try:
            token = request.cookies.get(SESSION_COOKIE, '')
            if not token:
                raise HTTPException(401, 'Sign in to continue')
            async with security_transaction(token) as db:
                account_session = await load_session(db, token)
            if not request.url.path.startswith('/auth/') and account_session['stage'] != 'full':
                raise HTTPException(401, 'Complete account verification before continuing.')
            if request.method not in {'GET','HEAD','OPTIONS'}:
                require_csrf(request,token)
        except HTTPException as error:
            return Response(content=json.dumps({'detail':error.detail}), status_code=error.status_code, media_type='application/json', headers={'Cache-Control':'no-store'})
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
async def directives(session: Annotated[AsyncSession, Depends(actor_session)], actor: Annotated[Actor, Depends(resolve_actor)]):
    rows = await session.scalars(select(Directive).order_by(Directive.number))
    return list(rows)




@app.get('/me')
async def me(actor: Annotated[Actor, Depends(resolve_actor)]) -> Actor:
    return actor


DB = Annotated[AsyncSession, Depends(actor_session, scope='function')]
CurrentActor = Annotated[Actor, Depends(resolve_actor)]


@app.get('/reports', response_model=list[ReportOut])
async def reports(session: DB, actor: CurrentActor, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)):
    require_role(actor, *[role for role in Role if role not in {Role.SYSTEM_ADMINISTRATOR,Role.DATA_PROTECTION_OFFICER}])
    return list(await session.scalars(select(MDAReport).order_by(MDAReport.created_at.desc(), MDAReport.id).limit(limit).offset(offset)))


@app.post('/reports', response_model=ReportOut, status_code=201)
async def create_report(body: ReportCreate, session: DB, actor: CurrentActor):
    require_role(actor, Role.MINISTRY_FOCAL)
    allowed = await session.scalar(text('SELECT public.record_scope(:ministry,:district,:directive)'),{'ministry':actor.institution_id,'district':body.district_id,'directive':body.directive_id})
    if not allowed:
        raise HTTPException(403,'This directive or district is outside your assigned scope.')
    report = MDAReport(**body.model_dump(), actor_id=actor.id, institution_id=actor.institution_id, is_sample=False)
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
    require_role(actor, Role.MINISTRY_FOCAL)
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
    require_role(actor, Role.MINISTRY_FOCAL,Role.DSEMR_ANALYST,Role.MIU_ANALYST,Role.CABINET_SECRETARIAT,Role.APEX_SECRETARIAT,Role.ACCOUNTING_OFFICER)
    report = await locked_report(session, report_id, body.version)
    if body.action == 'return' and not body.comment.strip():
        raise HTTPException(422, 'Explain the changes required before returning a report')
    try:
        report.state = transition(report.state, body.action, actor.role)
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc
    if actor.role != Role.MINISTRY_FOCAL:
        report.review_comment = body.comment
    report.version += 1
    await session.flush()
    await session.refresh(report)
    return report


@app.get('/audit')
async def audit(session: DB, actor: CurrentActor, limit: int = Query(50, ge=1, le=100)) -> list[dict]:
    require_role(actor, Role.SYSTEM_ADMINISTRATOR,Role.DATA_PROTECTION_OFFICER,Role.OVERSIGHT_LIAISON,Role.DSEMR_ANALYST,Role.MIU_ANALYST,Role.CABINET_SECRETARIAT,Role.APEX_SECRETARIAT,Role.ACCOUNTING_OFFICER)
    rows = await session.execute(text('SELECT id, actor_id, action, record_id, created_at, previous_hash, event_hash, is_sample FROM audit_event ORDER BY id DESC LIMIT :limit'), {'limit': limit})
    return [dict(row) for row in rows.mappings()]
