import asyncio
import hmac
import json
import secrets
from datetime import timedelta
from typing import Annotated, Literal
from uuid import UUID, uuid4

import pyotp
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import text

from .auth import (
    Actor,
    fail_attempt,
    load_session,
    new_session,
    record_event,
    require_csrf,
    require_origin,
    require_role,
    resolve_actor,
    security_transaction,
    set_session_cookie,
)
from .models import Role
from .security import (
    LOGIN_COOKIE,
    SESSION_COOKIE,
    cipher,
    csrf_token,
    digest,
    dummy_hash,
    login_nonce,
    password_hash,
    password_matches,
    recovery_hash,
    totp_counter,
    utcnow,
    valid_login_nonce,
)

router = APIRouter(prefix='/auth', tags=['Accounts'])


class StrictBody(BaseModel):
    model_config = ConfigDict(extra='forbid')


class LoginBody(StrictBody):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator('email')
    @classmethod
    def email_normalised(cls, value: str) -> str:
        return value.strip().lower()


class PasswordBody(StrictBody):
    password: str = Field(min_length=14, max_length=128)


class CodeBody(StrictBody):
    code: str = Field(min_length=6, max_length=100)
    method: Literal['totp','recovery'] = 'totp'


class InviteBody(StrictBody):
    email: str = Field(min_length=3, max_length=254, pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    name: str = Field(min_length=2, max_length=100)
    role: Role
    institution_id: UUID
    ministry_ids: list[UUID] = Field(default_factory=list, max_length=200)
    district_ids: list[UUID] = Field(default_factory=list, max_length=200)
    directive_ids: list[UUID] = Field(default_factory=list, max_length=2000)
    all_ministries: bool = False
    all_directives: bool = False
    current_password: str = Field(min_length=1, max_length=128)


class ResetBody(StrictBody):
    reason: str = Field(min_length=10, max_length=1000)
    current_password: str = Field(min_length=1, max_length=128)


def token_from(request: Request) -> str:
    return request.cookies.get(SESSION_COOKIE, '')


def stage_response(response: Response, token: str, stage: str, **extra) -> dict:
    set_session_cookie(response, token)
    return {'stage':stage,'csrf_token':csrf_token(token),**extra}


async def throttle(request: Request, db) -> None:
    ip = request.client.host if request.client else 'unknown'
    key = digest('login:' + ip)
    row = (await db.execute(text("""INSERT INTO auth_throttle(key_hash) VALUES(:key)
      ON CONFLICT(key_hash) DO UPDATE SET
      attempts=CASE WHEN auth_throttle.window_start<now()-interval '1 minute' THEN 1 ELSE auth_throttle.attempts+1 END,
      window_start=CASE WHEN auth_throttle.window_start<now()-interval '1 minute' THEN now() ELSE auth_throttle.window_start END
      RETURNING attempts"""), {'key':key})).scalar_one()
    if row > 20:
        raise HTTPException(429, 'Too many attempts. Wait one minute and retry.', headers={'Retry-After':'60'})


@router.get('/csrf')
async def csrf(response: Response):
    nonce = login_nonce()
    response.set_cookie(LOGIN_COOKIE, nonce, secure=True, httponly=True, samesite='strict', path='/', max_age=300)
    response.headers['Cache-Control'] = 'no-store'
    return {'csrf_token':nonce}


@router.post('/login')
async def login(body: LoginBody, request: Request, response: Response):
    require_origin(request)
    nonce = request.cookies.get(LOGIN_COOKIE,'')
    if not valid_login_nonce(nonce) or not hmac.compare_digest(nonce, request.headers.get('x-csrf-token','')):
        raise HTTPException(403, 'Reload the sign-in page before trying again.')
    failure = False
    async with security_transaction() as db:
        await throttle(request, db)
        row = (await db.execute(text('SELECT a.*,p.active FROM auth_account a JOIN profile p ON p.id=a.id WHERE a.email=:email FOR UPDATE OF a'), {'email':body.email})).mappings().first()
        matches = await asyncio.to_thread(password_matches, row['password_hash'] if row else dummy_hash, body.password)
        now = utcnow()
        valid = row and row['active'] and matches and (not row['locked_until'] or row['locked_until'] <= now) and (not row['credential_expires_at'] or row['credential_expires_at'] > now)
        if not valid:
            if row:
                await fail_attempt(db,row['id'])
            else:
                await record_event(db,None,'SIGN_IN_FAILED')
            failure = True
        else:
            await db.execute(text('UPDATE auth_account SET failed_attempts=0,locked_until=NULL WHERE id=:id'), {'id':row['id']})
            await db.execute(text("DELETE FROM auth_session WHERE account_id=:id AND stage<>'full'"), {'id':row['id']})
            stage = 'password' if row['must_change_password'] else 'mfa' if row['totp_secret'] else 'enrol'
            token = await new_session(db,row['id'],stage)
            await record_event(db,row['id'],'PASSWORD_VERIFIED')
    if failure:
        raise HTTPException(401,'Sign-in failed. Check your credentials or try again later.')
    return stage_response(response,token,stage)


@router.get('/session')
async def session_info(request: Request, response: Response):
    token = token_from(request)
    async with security_transaction(token) as db:
        row = await load_session(db,token)
    response.headers['Cache-Control']='no-store'
    return {'stage':row['stage'],'csrf_token':csrf_token(token),'account':{'id':row['id'],'name':row['name'],'email':row['email'],'role':row['role'],'institution_id':row['institution_id'],'institution_name':row['institution_name']},'expires_at':row['expires_at'],'idle_expires_at':row['idle_expires_at']}


@router.post('/password')
async def first_password(body: PasswordBody, request: Request, response: Response):
    token=token_from(request)
    require_csrf(request,token)
    async with security_transaction(token) as db:
        row=await load_session(db,token,lock=True)
        if row['stage']!='password':
            raise HTTPException(403,'A first-sign-in password change is not required for this session.')
        if password_matches(row['password_hash'],body.password):
            raise HTTPException(422,'Choose a different password from the temporary credential.')
        try:
            encoded=await asyncio.to_thread(password_hash,body.password)
        except ValueError as error:
            raise HTTPException(422,str(error)) from error
        await db.execute(text('UPDATE auth_account SET password_hash=:password,must_change_password=false,credential_expires_at=NULL WHERE id=:id'), {'password':encoded,'id':row['id']})
        await db.execute(text('DELETE FROM auth_session WHERE account_id=:id'), {'id':row['id']})
        stage='mfa' if row['totp_secret'] else 'enrol'
        next_token=await new_session(db,row['id'],stage)
        await record_event(db,row['id'],'PASSWORD_CHANGED')
    return stage_response(response,next_token,stage)


@router.post('/mfa/enrol')
async def enrol(request: Request, response: Response):
    token=token_from(request)
    require_csrf(request,token)
    async with security_transaction(token) as db:
        row=await load_session(db,token,lock=True)
        if row['stage']!='enrol' or row['totp_secret']:
            raise HTTPException(403,'Authenticator enrolment is not available for this session.')
        secret=pyotp.random_base32()
        await db.execute(text('UPDATE auth_account SET pending_totp=:secret WHERE id=:id'), {'secret':cipher().encrypt(secret.encode()).decode(),'id':row['id']})
        uri=pyotp.TOTP(secret).provisioning_uri(name=row['email'],issuer_name='APEX NEXUS')
    response.headers['Cache-Control']='no-store'
    return {'secret':secret,'uri':uri}


@router.post('/mfa/confirm')
async def confirm(body: CodeBody, request: Request, response: Response):
    token=token_from(request)
    require_csrf(request,token)
    failure=False
    async with security_transaction(token) as db:
        row=await load_session(db,token,lock=True)
        if row['stage']!='enrol' or not row['pending_totp'] or body.method!='totp':
            raise HTTPException(403,'Start authenticator enrolment first.')
        secret=cipher().decrypt(row['pending_totp'].encode()).decode()
        counter=totp_counter(secret,body.code,-1)
        if counter is None:
            await fail_attempt(db,row['id'])
            failure=True
        else:
            codes=[secrets.token_urlsafe(12) for _ in range(10)]
            await db.execute(text('UPDATE auth_account SET totp_secret=pending_totp,pending_totp=NULL,totp_last_counter=:counter,recovery_hashes=CAST(:codes AS jsonb),failed_attempts=0,locked_until=NULL WHERE id=:id'), {'counter':counter,'codes':json.dumps([recovery_hash(c) for c in codes]),'id':row['id']})
            next_token=await new_session(db,row['id'],'full',token)
            await record_event(db,row['id'],'MFA_ENROLLED')
    if failure:
        raise HTTPException(401,'The authenticator code was not accepted. Check the code and device time.')
    return stage_response(response,next_token,'full',recovery_codes=codes)


@router.post('/mfa/verify')
async def verify(body: CodeBody, request: Request, response: Response):
    token=token_from(request)
    require_csrf(request,token)
    failure=False
    async with security_transaction(token) as db:
        row=await load_session(db,token,lock=True)
        if row['stage']!='mfa' or not row['totp_secret']:
            raise HTTPException(403,'Sign in with your password first.')
        if body.method=='totp':
            counter=totp_counter(cipher().decrypt(row['totp_secret'].encode()).decode(),body.code,row['totp_last_counter'])
            valid=counter is not None
            stage='full'
            if valid:
                await db.execute(text('UPDATE auth_account SET totp_last_counter=:counter,failed_attempts=0,locked_until=NULL WHERE id=:id'), {'counter':counter,'id':row['id']})
        else:
            hashed=recovery_hash(body.code)
            valid=any(hmac.compare_digest(hashed,c) for c in row['recovery_hashes'])
            stage='enrol'
            if valid:
                remaining=[c for c in row['recovery_hashes'] if not hmac.compare_digest(c,hashed)]
                await db.execute(text('UPDATE auth_account SET totp_secret=NULL,pending_totp=NULL,totp_last_counter=-1,recovery_hashes=CAST(:remaining AS jsonb),failed_attempts=0,locked_until=NULL WHERE id=:id'), {'remaining':json.dumps(remaining),'id':row['id']})
                await db.execute(text('DELETE FROM auth_session WHERE account_id=:id'), {'id':row['id']})
        if not valid:
            await fail_attempt(db,row['id'])
            failure=True
        else:
            next_token=await new_session(db,row['id'],stage,token)
            await record_event(db,row['id'],'MFA_VERIFIED' if stage=='full' else 'RECOVERY_USED')
    if failure:
        raise HTTPException(401,'The code was not accepted. Use a current unused code.')
    return stage_response(response,next_token,stage)


@router.post('/logout')
async def logout(request: Request, response: Response):
    token=token_from(request)
    require_csrf(request,token)
    async with security_transaction(token) as db:
        row=await load_session(db,token)
        await db.execute(text('DELETE FROM auth_session WHERE token_hash=:hash'), {'hash':digest(token)})
        await record_event(db,row['id'],'SIGNED_OUT')
    response.delete_cookie(SESSION_COOKIE,path='/',secure=True,httponly=True,samesite='strict')
    return {'signed_out':True}


@router.get('/admin/accounts')
async def list_accounts(actor: Annotated[Actor,Depends(resolve_actor)],request: Request):
    require_role(actor,Role.SYSTEM_ADMINISTRATOR)
    async with security_transaction(token_from(request)) as db:
        rows=await db.execute(text('SELECT p.id,p.name,p.role,p.institution_id,p.active,a.email,a.must_change_password,(a.totp_secret IS NOT NULL) AS mfa_enrolled FROM profile p JOIN auth_account a ON a.id=p.id ORDER BY p.name LIMIT 100'))
        return [dict(r) for r in rows.mappings()]


@router.post('/admin/invitations',status_code=201)
async def invite(body: InviteBody,request: Request,actor: Annotated[Actor,Depends(resolve_actor)]):
    require_role(actor,Role.SYSTEM_ADMINISTRATOR)
    async with security_transaction(token_from(request)) as db:
        admin=await load_session(db,token_from(request))
        if not await asyncio.to_thread(password_matches,admin['password_hash'],body.current_password):
            raise HTTPException(403,'Confirm your administrator password.')
        if body.role in {Role.MINISTRY_FOCAL,Role.ACCOUNTING_OFFICER} and (body.all_ministries or set(body.ministry_ids)!={body.institution_id}):
            raise HTTPException(422,'Ministry accounts must be scoped only to their own ministry.')
        if body.role==Role.FIELD_VERIFIER and not body.district_ids:
            raise HTTPException(422,'Field verifiers require at least one assigned district.')
        for table,ids in [('institution',[body.institution_id,*body.ministry_ids]),('district',body.district_ids),('directive',body.directive_ids)]:
            if ids:
                count=await db.scalar(text(f'SELECT count(*) FROM {table} WHERE id=ANY(:ids)'),{'ids':list(set(ids))})
                if count!=len(set(ids)):
                    raise HTTPException(422,'One or more scope records do not exist.')
        if await db.scalar(text('SELECT 1 FROM auth_account WHERE email=:email'),{'email':body.email.lower()}):
            raise HTTPException(409,'An account already uses that email address.')
        account_id=uuid4()
        temporary=secrets.token_urlsafe(24)
        await db.execute(text('INSERT INTO profile(id,name,role,institution_id,is_sample,active) VALUES(:id,:name,:role,:institution,false,true)'),{'id':account_id,'name':body.name,'role':body.role.value,'institution':body.institution_id})
        await db.execute(text('''INSERT INTO auth_account(id,email,password_hash,credential_expires_at,ministry_ids,district_ids,directive_ids,all_ministries,all_directives)
           VALUES(:id,:email,:password,:expiry,:ministries,:districts,:directives,:all_ministries,:all_directives)'''),{'id':account_id,'email':body.email.lower(),'password':await asyncio.to_thread(password_hash,temporary),'expiry':utcnow()+timedelta(hours=24),'ministries':body.ministry_ids,'districts':body.district_ids,'directives':body.directive_ids,'all_ministries':body.all_ministries,'all_directives':body.all_directives})
        await record_event(db,actor.id,'ACCOUNT_INVITED',{'account_id':str(account_id),'role':body.role.value})
    return {'id':account_id,'temporary_password':temporary,'expires_in_hours':24,'instruction':'Share this credential through your approved private channel. It will not be shown again.'}


@router.post('/admin/accounts/{account_id}/reset')
async def reset_password(account_id: UUID,body: ResetBody,request: Request,actor: Annotated[Actor,Depends(resolve_actor)]):
    require_role(actor,Role.SYSTEM_ADMINISTRATOR)
    async with security_transaction(token_from(request)) as db:
        admin=await load_session(db,token_from(request))
        if not await asyncio.to_thread(password_matches,admin['password_hash'],body.current_password):
            raise HTTPException(403,'Confirm your administrator password.')
        if not await db.scalar(text('SELECT 1 FROM auth_account WHERE id=:id'),{'id':account_id}):
            raise HTTPException(404,'Account not found')
        temporary=secrets.token_urlsafe(24)
        await db.execute(text('UPDATE auth_account SET password_hash=:hash,must_change_password=true,credential_expires_at=:expiry,failed_attempts=0,locked_until=NULL WHERE id=:id'),{'hash':await asyncio.to_thread(password_hash,temporary),'expiry':utcnow()+timedelta(hours=24),'id':account_id})
        await db.execute(text('DELETE FROM auth_session WHERE account_id=:id'),{'id':account_id})
        await record_event(db,actor.id,'PASSWORD_RESET',{'account_id':str(account_id),'reason':body.reason})
    return {'temporary_password':temporary,'expires_in_hours':24,'mfa_preserved':True}
