import secrets
from datetime import timedelta
from uuid import uuid4

import httpx
import psycopg
import pyotp
import pytest
from nexus.db import engine
from nexus.main import app
from nexus.models import Role
from nexus.security import SESSION_COOKIE, cipher, csrf_token, digest, password_hash, password_matches, totp_counter, utcnow

OWNER='postgresql://postgres@127.0.0.1:55432/nexus_accounts_test'
RUNTIME='postgresql://nexus_app@127.0.0.1:55432/nexus_accounts_test'


@pytest.fixture
def accounts():
    password=secrets.token_urlsafe(24)
    encoded_password=password_hash(password)
    data={'password':password,'ministries':[uuid4(),uuid4()],'districts':[uuid4(),uuid4()],'directives':[uuid4(),uuid4()],'users':{}}
    with psycopg.connect(OWNER) as db:
        db.execute('DELETE FROM auth_throttle')
        for i,identifier in enumerate(data['ministries']):
            db.execute("INSERT INTO institution(id,name,provenance) VALUES(%s,%s,'unverified')",(identifier,f'Scope test {identifier}'))
        for identifier in data['districts']:
            db.execute("INSERT INTO district(id,name) VALUES(%s,%s)",(identifier,f'Scope district {identifier}'))
        # The earlier register has a bounded number key; use existing numbers for repeated runs.
        for i,identifier in enumerate(data['directives']):
            existing=db.execute('SELECT id FROM directive WHERE number=%s',(i+1,)).fetchone()
            if existing:
                data['directives'][i]=existing[0]
            else:
                db.execute("INSERT INTO directive(id,number,title,full_text,provenance,citations) VALUES(%s,%s,%s,'Test scope record','unverified','[]')",(identifier,i+1,f'Test directive {i+1}'))
        for role in Role:
            account_id=uuid4()
            secret=pyotp.random_base32()
            token=secrets.token_urlsafe(32)
            db.execute('INSERT INTO profile(id,name,role,institution_id,is_sample,active) VALUES(%s,%s,%s,%s,false,true)',(account_id,f'Test {role.value}',role.value,data['ministries'][0]))
            db.execute('''INSERT INTO auth_account(id,email,password_hash,must_change_password,totp_secret,ministry_ids,district_ids,directive_ids)
             VALUES(%s,%s,%s,false,%s,%s,%s,%s)''',(account_id,f'{account_id}@test.invalid',encoded_password,cipher().encrypt(secret.encode()).decode(),data['ministries'][:1],data['districts'][:1],data['directives'][:1]))
            db.execute("INSERT INTO auth_session(token_hash,account_id,stage,expires_at,idle_expires_at) VALUES(%s,%s,'full',%s,%s)",(digest(token),account_id,utcnow()+timedelta(hours=1),utcnow()+timedelta(minutes=20)))
            data['users'][role.value]={'id':account_id,'email':f'{account_id}@test.invalid','token':token,'secret':secret}
    return data


def client_for(user=None):
    client=httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='https://testserver',headers={'Origin':'https://testserver','Content-Type':'application/json'})
    if user:
        client.cookies.set(SESSION_COOKIE,user['token'],domain='testserver.local',path='/')
        client.headers['X-CSRF-Token']=csrf_token(user['token'])
    return client


async def login(client,user,password):
    csrf=await client.get('/auth/csrf')
    client.headers['X-CSRF-Token']=csrf.json()['csrf_token']
    result=await client.post('/auth/login',json={'email':user['email'],'password':password})
    if result.status_code==200:
        client.headers['X-CSRF-Token']=result.json()['csrf_token']
    return result


@pytest.mark.asyncio
async def test_enrol_password_change_cookie_rotation_recovery_and_replay(accounts):
    user=accounts['users']['MINISTRY_FOCAL']
    with psycopg.connect(OWNER) as db:
        db.execute('UPDATE auth_account SET must_change_password=true,totp_secret=NULL WHERE id=%s',(user['id'],))
    async with client_for() as client:
        response=await login(client,user,accounts['password'])
        assert response.status_code==200
        assert response.json()['stage']=='password'
        cookie=response.headers['set-cookie']
        assert all(value in cookie for value in ['HttpOnly','Secure','SameSite=strict','Path=/'])
        assert (await client.get('/reports')).status_code==401
        previous=client.cookies.get(SESSION_COOKIE)
        response=await client.post('/auth/password',json={'password':secrets.token_urlsafe(24)})
        assert response.status_code==200
        assert response.json()['stage']=='enrol'
        assert client.cookies.get(SESSION_COOKIE)!=previous
        client.headers['X-CSRF-Token']=response.json()['csrf_token']
        response=await client.post('/auth/mfa/enrol',json={})
        assert response.status_code==200
        secret=response.json()['secret']
        code=pyotp.TOTP(secret).now()
        response=await client.post('/auth/mfa/confirm',json={'code':code})
        assert response.status_code==200
        recovery=response.json()['recovery_codes']
        assert len(recovery)==10 and len(set(recovery))==10
        client.headers['X-CSRF-Token']=response.json()['csrf_token']
        assert (await client.get('/me')).status_code==200
        assert (await client.get('/reports')).status_code==200
        assert (await client.post('/auth/mfa/confirm',json={'code':code})).status_code==403
        with psycopg.connect(OWNER) as db:
            stored=db.execute('SELECT totp_secret,recovery_hashes,totp_last_counter FROM auth_account WHERE id=%s',(user['id'],)).fetchone()
            assert stored[0]!=secret and recovery[0] not in stored[1]
            assert totp_counter(secret,code,stored[2]) is None
            db.execute("UPDATE auth_session SET stage='mfa' WHERE token_hash=%s",(digest(client.cookies.get(SESSION_COOKIE)),))
        response=await client.post('/auth/mfa/verify',json={'code':recovery[0],'method':'recovery'})
        assert response.status_code==200 and response.json()['stage']=='enrol'
        client.headers['X-CSRF-Token']=response.json()['csrf_token']
        assert (await client.get('/me')).status_code==401
        assert (await client.post('/auth/mfa/verify',json={'code':recovery[0],'method':'recovery'})).status_code==403
    await engine.dispose()


@pytest.mark.asyncio
async def test_bad_credentials_lockout_and_csrf(accounts):
    user=accounts['users']['MINISTRY_FOCAL']
    async with client_for() as client:
        assert (await client.post('/auth/login',json={'email':user['email'],'password':accounts['password']})).status_code==403
        for _ in range(5):
            assert (await login(client,user,'wrong password')).status_code==401
        assert (await login(client,user,accounts['password'])).status_code==401
    with psycopg.connect(OWNER) as db:
        assert db.execute('SELECT locked_until>now() FROM auth_account WHERE id=%s',(user['id'],)).fetchone()[0]
    admin=accounts['users']['SYSTEM_ADMINISTRATOR']
    async with client_for(admin) as client:
        client.headers['X-CSRF-Token']='invalid'
        assert (await client.post('/auth/logout',json={})).status_code==403
        client.headers['X-CSRF-Token']=csrf_token(admin['token'])
        client.headers['Origin']='https://untrusted.invalid'
        assert (await client.post('/auth/logout',json={})).status_code==403
    await engine.dispose()


@pytest.mark.asyncio
async def test_idle_absolute_expiry_and_logout(accounts):
    for column in ['idle_expires_at','expires_at']:
        user=accounts['users']['MINISTRY_FOCAL' if column=='idle_expires_at' else 'DSEMR_ANALYST']
        with psycopg.connect(OWNER) as db:
            db.execute(f"UPDATE auth_session SET {column}=now()-interval '1 second' WHERE token_hash=%s",(digest(user['token']),))
        async with client_for(user) as client:
            assert (await client.get('/me')).status_code==401
    async with client_for(accounts['users']['SYSTEM_ADMINISTRATOR']) as client:
        assert (await client.post('/auth/logout',json={})).status_code==200
        assert (await client.get('/me')).status_code==401
    await engine.dispose()


@pytest.mark.asyncio
@pytest.mark.parametrize('role',[r.value for r in Role])
async def test_role_endpoint_matrix(accounts,role):
    async with client_for(accounts['users'][role]) as client:
        assert (await client.get('/me')).status_code==200
        reports=await client.get('/reports')
        assert reports.status_code==(403 if role in {'SYSTEM_ADMINISTRATOR','DATA_PROTECTION_OFFICER'} else 200)
        users=await client.get('/auth/admin/accounts')
        assert users.status_code==(200 if role=='SYSTEM_ADMINISTRATOR' else 403)
        body={'title':'Permission boundary test','period':'FY2026/27 Q2','narrative':'A test report used to verify scope enforcement.','directive_id':str(accounts['directives'][0]),'district_id':str(accounts['districts'][0])}
        response=await client.post('/reports',json=body)
        assert response.status_code==(201 if role=='MINISTRY_FOCAL' else 403)
    await engine.dispose()


@pytest.mark.asyncio
async def test_cross_ministry_district_directive_and_admin_denials(accounts):
    officer=accounts['users']['MINISTRY_FOCAL']
    body={'title':'Scoped report','period':'FY2026/27 Q2','narrative':'Scope-bound report for database isolation testing.','directive_id':str(accounts['directives'][0]),'district_id':str(accounts['districts'][0])}
    async with client_for(officer) as client:
        result=await client.post('/reports',json=body)
        assert result.status_code==201
        report=result.json()
        bad=await client.post('/reports',json={**body,'directive_id':str(accounts['directives'][1])})
        assert bad.status_code==403
        assert (await client.post('/reports/'+report['id']+'/transition',json={'version':1,'action':'submit'})).status_code==200
    async with client_for(accounts['users']['DSEMR_ANALYST']) as client:
        assert (await client.post('/reports/'+report['id']+'/transition',json={'version':2,'action':'review'})).status_code==200
        assert (await client.post('/reports/'+report['id']+'/transition',json={'version':3,'action':'accept'})).status_code==200
    field=accounts['users']['FIELD_VERIFIER']
    with psycopg.connect(RUNTIME) as db:
        db.execute("SELECT set_config('app.session_token',%s,true)",(field['token'],))
        assert db.execute('SELECT id FROM mda_report WHERE id=%s',(report['id'],)).fetchone()
    with psycopg.connect(OWNER) as db:
        db.execute('UPDATE auth_account SET district_ids=%s WHERE id=%s',(accounts['districts'][1:],field['id']))
    async with client_for(field) as client:
        assert all(r['id']!=report['id'] for r in (await client.get('/reports')).json())
    with psycopg.connect(RUNTIME) as db:
        db.execute("SELECT set_config('app.session_token',%s,true)",(field['token'],))
        assert db.execute('SELECT id FROM mda_report WHERE id=%s',(report['id'],)).fetchone() is None
        db.commit()
        assert db.execute('SELECT id FROM mda_report').fetchall()==[]
    with psycopg.connect(OWNER) as db:
        db.execute('UPDATE auth_account SET ministry_ids=%s WHERE id=%s',(accounts['ministries'][1:],officer['id']))
    async with client_for(officer) as client:
        assert all(r['id']!=report['id'] for r in (await client.get('/reports')).json())
    with psycopg.connect(RUNTIME) as db:
        db.execute("SELECT set_config('app.session_token',%s,true)",(officer['token'],))
        assert db.execute('SELECT id FROM mda_report WHERE id=%s',(report['id'],)).fetchone() is None
        assert db.execute("UPDATE profile SET role='SYSTEM_ADMINISTRATOR' WHERE id=%s",(officer['id'],)).rowcount==0
    await engine.dispose()


@pytest.mark.asyncio
async def test_administrator_invitation_and_reset(accounts):
    admin=accounts['users']['SYSTEM_ADMINISTRATOR']
    async with client_for(admin) as client:
        body={'email':f'{uuid4()}@test.invalid','name':'Account invitation test','role':'MINISTRY_FOCAL','institution_id':str(accounts['ministries'][0]),'ministry_ids':[str(accounts['ministries'][0])],'directive_ids':[str(accounts['directives'][0])],'current_password':accounts['password']}
        response=await client.post('/auth/admin/invitations',json=body)
        assert response.status_code==201
        account_id=response.json()['id']
        temporary=response.json()['temporary_password']
        listed=await client.get('/auth/admin/accounts')
        assert 'temporary_password' not in listed.text and temporary not in listed.text
        with psycopg.connect(OWNER) as db:
            record=db.execute('SELECT password_hash,must_change_password FROM auth_account WHERE id=%s',(account_id,)).fetchone()
            assert record[1] and password_matches(record[0],temporary)
        response=await client.post(f'/auth/admin/accounts/{account_id}/reset',json={'reason':'Account holder requested an authorised reset.','current_password':accounts['password']})
        assert response.status_code==200 and response.json()['mfa_preserved']
        assert response.json()['temporary_password']!=temporary
    await engine.dispose()
