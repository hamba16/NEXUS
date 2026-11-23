"""Create the first administrator from process environment; print no credentials."""
import os
import sys
from pathlib import Path
from uuid import uuid4

from sqlalchemy import create_engine, text

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'services/api'))
from nexus.security import password_hash  # noqa: E402


def bootstrap() -> None:
    required=['MIGRATION_DATABASE_URL','BOOTSTRAP_ADMIN_EMAIL','BOOTSTRAP_ADMIN_NAME','BOOTSTRAP_ADMIN_PASSWORD','BOOTSTRAP_ORGANISATION']
    missing=[name for name in required if not os.environ.get(name)]
    if missing:
        raise SystemExit('Set required environment variables: '+', '.join(missing))
    encoded=password_hash(os.environ['BOOTSTRAP_ADMIN_PASSWORD'])
    url=os.environ['MIGRATION_DATABASE_URL'].replace('postgresql://','postgresql+psycopg://',1)
    engine=create_engine(url)
    with engine.begin() as db:
        db.execute(text('SELECT pg_advisory_xact_lock(180407)'))
        if db.scalar(text('SELECT count(*) FROM auth_account')):
            raise SystemExit('Bootstrap is closed: an account already exists. Use account administration.')
        institution_id=uuid4()
        account_id=uuid4()
        db.execute(text("INSERT INTO institution(id,name,provenance,source,is_sample) VALUES(:id,:name,'unverified','{}',false)"),{'id':institution_id,'name':os.environ['BOOTSTRAP_ORGANISATION']})
        db.execute(text("INSERT INTO profile(id,name,role,institution_id,is_sample,active) VALUES(:id,:name,'SYSTEM_ADMINISTRATOR',:institution,false,true)"),{'id':account_id,'name':os.environ['BOOTSTRAP_ADMIN_NAME'],'institution':institution_id})
        db.execute(text('INSERT INTO auth_account(id,email,password_hash,must_change_password) VALUES(:id,:email,:hash,true)'),{'id':account_id,'email':os.environ['BOOTSTRAP_ADMIN_EMAIL'].strip().lower(),'hash':encoded})
        db.execute(text("INSERT INTO security_event(account_id,action) VALUES(:id,'ADMINISTRATOR_CREATED')"),{'id':account_id})
    engine.dispose()
    print('Initial administrator created. Password change and authenticator enrolment are required at first sign-in.')


if __name__=='__main__':
    bootstrap()
