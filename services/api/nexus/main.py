import asyncio
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
from .contracts import DirectiveOut, ProfileOut, PublicContextPackOut, PublicContextRecordOut, ReportCreate, ReportEdit, ReportOut, Transition
from .db import check_database_role, engine, public_session
from .domain import transition
from .models import Directive, Institution, MDAReport, Profile, PublicContextPack, PublicContextRecord, Role
from .neon_services import ai_gateway_status, function_status, object_storage_status, postgres_status, realtime_status
from seed.import_context_pack import import_payload

settings = get_settings()
logger = logging.getLogger('nexus')
logging.basicConfig(level=logging.INFO, format='%(message)s')


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.warning(json.dumps({'event': 'OPEN_ACCESS_WARNING', 'message': 'Anyone can select any profile. Do not use confidential data.'}))
    await check_database_role()
    yield
    await engine.dispose()


app = FastAPI(title='APEX NEXUS API', version='0.1.0', lifespan=lifespan, description='Open profile mode. Operational data is simulated. No identity assurance.')
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=['GET', 'POST', 'PATCH'], allow_headers=['Content-Type', 'X-Actor-Id', 'X-Request-Id'], expose_headers=['X-Request-Id'])
request_windows: OrderedDict[str, deque[float]] = OrderedDict()
request_count = 0


@app.middleware('http')
async def observe(request: Request, call_next):
    global request_count
    started = time.monotonic()
    request_id = str(uuid4())
    key = request.client.host if request.client else 'unknown'
    window = request_windows.setdefault(key, deque())
    request_windows.move_to_end(key)
    while window and window[0] < started - 60:
        window.popleft()
    if len(request_windows) > 10000:
        request_windows.popitem(last=False)
    if request.url.path not in {'/healthz', '/readyz', '/metrics'} and len(window) >= settings.request_limit_per_minute:
        return Response(status_code=429, headers={'Retry-After': '60', 'X-Request-Id': request_id})
    window.append(started)
    request_count += 1
    response = await call_next(request)
    response.headers.update({'X-Request-Id': request_id, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store'})
    logger.info(json.dumps({'request_id': request_id, 'method': request.method, 'path': request.url.path, 'status': response.status_code, 'duration_ms': round((time.monotonic() - started) * 1000, 2)}))
    return response


@app.get('/healthz')
async def healthz() -> dict:
    return {'status': 'ok', 'auth_mode': 'open', 'data_mode': settings.data_mode}


@app.get('/readyz')
async def readyz() -> dict:
    try:
        await check_database_role()
    except Exception as exc:
        raise HTTPException(503, 'Database or application role is not ready') from exc
    return {'status': 'ready', 'database': 'ok', 'scope': 'API database foundation; blob/worker readiness not implemented yet'}


@app.get('/neon/status')
async def neon_status(session: Annotated[AsyncSession, Depends(public_session)]):
    return {
        'postgres': await postgres_status(session),
        'functions': await function_status(),
        'object_storage': await object_storage_status(),
        'ai_gateway': await ai_gateway_status(),
        'realtime': await realtime_status(),
    }


@app.get('/metrics', response_class=Response)
async def metrics() -> Response:
    return Response(f'# TYPE nexus_http_requests_total counter\nnexus_http_requests_total {request_count}\n', media_type='text/plain; version=0.0.4')


@app.post('/context/import')
async def context_import(payload: dict, actor: Annotated[Actor, Depends(resolve_actor)]):
    require_role(actor, Role.SECRETARIAT)
    if not isinstance(payload.get('meta'), dict) or not payload['meta'].get('name'):
        raise HTTPException(422, 'Context JSON must include meta.name')
    try:
        result = await asyncio.to_thread(import_payload, payload)
    except Exception as exc:
        raise HTTPException(422, f'Context import failed: {exc}') from exc
    return result


@app.get('/context/packs', response_model=list[PublicContextPackOut])
async def context_packs(session: Annotated[AsyncSession, Depends(public_session)]):
    rows = await session.scalars(select(PublicContextPack).order_by(PublicContextPack.created_at.desc()))
    return list(rows)


@app.get('/context/{section}', response_model=list[PublicContextRecordOut])
async def context_records(section: str, session: Annotated[AsyncSession, Depends(public_session)], limit: int = Query(500, ge=1, le=1000)):
    rows = await session.scalars(select(PublicContextRecord).where(PublicContextRecord.section == section).order_by(PublicContextRecord.slug).limit(limit))
    return list(rows)


@app.get('/context', response_model=dict)
async def context_summary(session: Annotated[AsyncSession, Depends(public_session)]):
    pack = await session.scalar(select(PublicContextPack).order_by(PublicContextPack.created_at.desc()).limit(1))
    if pack is None:
        return {'loaded': False, 'meta': {'as_of': None}, 'counts': {}, 'sources': []}
    counts = dict((await session.execute(text("SELECT section, count(*) FROM public_context_record WHERE pack_id=:pack_id GROUP BY section"), {'pack_id': pack.id})).all())
    meta = pack.meta or {}
    sources = [record.payload for record in await session.scalars(select(PublicContextRecord).where(PublicContextRecord.pack_id == pack.id, PublicContextRecord.section == 'sources'))]
    return {'loaded': True, 'meta': meta, 'counts': counts, 'sources': sources}


@app.get('/directives', response_model=list[DirectiveOut])
async def directives(session: Annotated[AsyncSession, Depends(public_session)]):
    rows = await session.scalars(select(Directive).order_by(Directive.number))
    return list(rows)


@app.get('/profiles', response_model=list[ProfileOut])
async def profiles(session: Annotated[AsyncSession, Depends(public_session)]) -> list[dict]:
    rows = await session.execute(select(Profile, Institution.name).join(Institution).where(Profile.active.is_(True)).order_by(Profile.role, Profile.name))
    return [{'id': p.id, 'name': p.name, 'role': p.role, 'institution_id': p.institution_id, 'institution_name': name, 'is_simulated': p.is_simulated} for p, name in rows]


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
        raise HTTPException(409, 'Clean mode does not accept simulated operational records')
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
