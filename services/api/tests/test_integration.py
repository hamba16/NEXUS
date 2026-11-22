"""Runs against real PostgreSQL, as non-owner nexus_app. No SQLite substitute."""
import hashlib
import os
from uuid import NAMESPACE_URL, uuid4, uuid5

import httpx
import psycopg
import pytest
from nexus.db import check_database_role, engine
from nexus.main import app

pytestmark = pytest.mark.integration


def sid(value):
    return str(uuid5(NAMESPACE_URL, 'apex-nexus:foundation:' + value))


def connection():
    return psycopg.connect(os.environ.get('TEST_DATABASE_URL', 'postgresql://nexus_app@127.0.0.1:55432/nexus'))


def actor_context(conn, role, index=0):
    institution = index + 1 if role == 'MDA_OFFICER' else 0
    conn.execute("SELECT set_config('app.actor_id', %s, true),set_config('app.role',%s,true),set_config('app.mda_id',%s,true)", (sid(f'{role}-{index}'), role, sid(f'institution-{institution}')))


@pytest.fixture
def draft():
    with connection() as conn:
        actor_context(conn, 'MDA_OFFICER')
        record_id = uuid4()
        conn.execute("INSERT INTO mda_report(id,institution_id,actor_id,title,period,narrative) VALUES (%s,%s,%s,'Test draft','FY2026/27 Q2','Synthetic narrative for isolation testing')", (record_id, sid('institution-1'), sid('MDA_OFFICER-0')))
    return record_id


@pytest.mark.parametrize('role,index,visible', [('MDA_OFFICER',0,True),('MDA_OFFICER',1,False),('SECRETARIAT',0,True),('FIELD_MONITOR',0,False),('CONVENER',0,False),('ANCHOR_ENTITY',0,False),('OVERSIGHT',0,False)])
def test_sql_draft_isolation(draft, role, index, visible):
    with connection() as conn:
        actor_context(conn, role, index)
        assert bool(conn.execute('SELECT id FROM mda_report WHERE id=%s', (draft,)).fetchone()) is visible
        assert bool(conn.execute('SELECT id FROM report_revision WHERE report_id=%s', (draft,)).fetchone()) is visible


def test_context_cannot_leak_across_transactions(draft):
    with connection() as conn:
        actor_context(conn, 'SECRETARIAT')
        assert conn.execute('SELECT id FROM mda_report WHERE id=%s', (draft,)).fetchone()
        conn.commit()
        assert conn.execute('SELECT id FROM mda_report').fetchall() == []
        assert conn.execute('SELECT id FROM audit_event').fetchall() == []
        assert conn.execute('SELECT id FROM report_revision').fetchall() == []
        actor_context(conn, 'SECRETARIAT')
        conn.rollback()
        assert conn.execute('SELECT id FROM mda_report').fetchall() == []


def test_sql_blocks_cross_institution_write_and_self_approval(draft):
    with connection() as conn:
        actor_context(conn, 'MDA_OFFICER', 1)
        assert conn.execute('UPDATE mda_report SET title=%s,version=version+1 WHERE id=%s', ('Other institution write',draft)).rowcount == 0
    with connection() as conn:
        actor_context(conn, 'MDA_OFFICER')
        with pytest.raises(psycopg.Error):
            conn.execute("UPDATE mda_report SET state='ACCEPTED',version=version+1 WHERE id=%s", (draft,))
    with connection() as conn:
        actor_context(conn, 'MDA_OFFICER')
        with pytest.raises(psycopg.Error):
            conn.execute('UPDATE mda_report SET institution_id=%s,version=version+1 WHERE id=%s', (sid('institution-2'),draft))


@pytest.mark.parametrize('table', ['mda_report','report_revision','audit_event'])
def test_rls_is_forced_and_truncate_denied(table):
    with connection() as conn:
        row = conn.execute('SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid=%s::regclass', (table,)).fetchone()
        assert row == (True, True)
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            conn.execute(f'TRUNCATE {table}')  # Fixed parametrised test table list, not user input.


@pytest.mark.parametrize('role,visible', [('SECRETARIAT',True),('OVERSIGHT',True),('MDA_OFFICER',False),('FIELD_MONITOR',False),('CONVENER',False),('ANCHOR_ENTITY',False)])
def test_audit_read_policy(draft, role, visible):
    with connection() as conn:
        actor_context(conn, role)
        assert bool(conn.execute('SELECT id FROM audit_event WHERE record_id=%s', (draft,)).fetchone()) is visible


def test_audit_chain_and_append_only(draft):
    with connection() as conn:
        actor_context(conn, 'SECRETARIAT')
        rows = conn.execute('SELECT actor_id,action,record_id,payload_hash,previous_hash,event_hash FROM audit_event ORDER BY id').fetchall()
        previous = '0' * 64
        for actor,action,record,payload,prev,digest in rows:
            assert prev == previous
            assert digest == hashlib.sha256(f'{prev}|{actor}|{action}|{record}|{payload}'.encode()).hexdigest()
            previous = digest
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            conn.execute('DELETE FROM audit_event')


@pytest.mark.asyncio
async def test_api_workflow_conflicts_and_role_denials():
    await check_database_role()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url='http://test') as client:
        profiles = await client.get('/profiles')
        assert profiles.status_code == 200
        assert len(profiles.json()) == 40
        mda = {'X-Actor-Id':sid('MDA_OFFICER-0')}
        other = {'X-Actor-Id':sid('MDA_OFFICER-1')}
        secretariat = {'X-Actor-Id':sid('SECRETARIAT-0')}
        convener = {'X-Actor-Id':sid('CONVENER-0')}
        body = {'title':'Quarterly test report','period':'FY2026/27 Q2','narrative':'Synthetic progress narrative for API tests.'}
        result = await client.post('/reports',headers=mda,json=body)
        assert result.status_code == 201, result.text
        report = result.json()
        assert (await client.patch('/reports/'+report['id'],headers=other,json={**body,'version':1})).status_code == 404
        assert (await client.post('/reports',headers=convener,json=body)).status_code == 403
        assert (await client.get('/reports',headers=convener)).status_code == 403
        assert (await client.get('/reports')).status_code == 422
        assert (await client.get('/reports',headers={'X-Actor-Id':str(uuid4())})).status_code == 400
        for version,action,headers,state in [(1,'submit',mda,'SUBMITTED'),(2,'review',secretariat,'UNDER_REVIEW'),(3,'return',secretariat,'RETURNED'),(4,'submit',mda,'SUBMITTED'),(5,'review',secretariat,'UNDER_REVIEW'),(6,'accept',secretariat,'ACCEPTED')]:
            response = await client.post(f"/reports/{report['id']}/transition",headers=headers,json={'version':version,'action':action,'comment':'Please supply the missing baseline.'})
            assert response.status_code == 200, response.text
            assert response.json()['state'] == state
        stale = await client.post(f"/reports/{report['id']}/transition",headers=secretariat,json={'version':1,'action':'review'})
        assert stale.status_code == 409
        anchor = await client.get('/reports',headers={'X-Actor-Id':sid('ANCHOR_ENTITY-0')})
        assert all(r['state']=='ACCEPTED' for r in anchor.json())
    await engine.dispose()
