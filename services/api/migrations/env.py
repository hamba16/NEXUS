import os

from alembic import context
from nexus.models import Base
from sqlalchemy import create_engine, pool

url = os.environ.get('MIGRATION_DATABASE_URL')
if not url:
    raise RuntimeError('MIGRATION_DATABASE_URL is required; never run migrations as the API role')

if context.is_offline_mode():
    context.configure(url=url, target_metadata=Base.metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    engine = create_engine(url, poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=Base.metadata)
        with context.begin_transaction():
            context.run_migrations()
