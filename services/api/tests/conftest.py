import asyncio
import os
import secrets
import sys

import pytest
from cryptography.fernet import Fernet

# Tests never load a hosted connection from a private developer file.
os.environ['DATABASE_URL']='postgresql+psycopg://nexus_app@127.0.0.1:55432/nexus_accounts_test'
os.environ['NODE_ENV']='test'
os.environ['APP_ORIGIN']='https://testserver'
os.environ['MFA_ENCRYPTION_KEY']=Fernet.generate_key().decode()
os.environ['SESSION_SIGNING_KEY']=secrets.token_urlsafe(48)


@pytest.fixture(scope='session')
def event_loop_policy():
    if sys.platform=='win32':
        return asyncio.WindowsSelectorEventLoopPolicy()
    return asyncio.DefaultEventLoopPolicy()
