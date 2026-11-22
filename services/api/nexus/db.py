from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import get_settings

engine = create_async_engine(get_settings().database_url.get_secret_value(), pool_pre_ping=True, pool_size=5, max_overflow=5)
Session = async_sessionmaker(engine, expire_on_commit=False)


async def public_session() -> AsyncIterator[AsyncSession]:
    async with Session() as session, session.begin():
        yield session


async def check_database_role() -> None:
    async with engine.connect() as connection:
        row = (await connection.execute(text('SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user'))).one()
        owns = await connection.scalar(text("SELECT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tableowner=current_user)"))
        if row.rolsuper or row.rolbypassrls or owns:
            raise RuntimeError('API database role must not own tables or bypass RLS')
        await connection.execute(text('SELECT id FROM public.profile LIMIT 1'))
