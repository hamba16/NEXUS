from dotenv import dotenv_values
import psycopg

env = dotenv_values('.env.local')
url = env['DATABASE_URL_UNPOOLED'].strip().strip('"\'')

owner_url = env['DATABASE_URL_UNPOOLED'].strip().strip('"\'')

with psycopg.connect(owner_url) as connection:
    role = connection.execute(
        'SELECT current_user, session_user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname=current_user'
    ).fetchone()
    nexus_app_exists = connection.execute(
        "SELECT exists(SELECT 1 FROM pg_roles WHERE rolname='nexus_app')"
    ).fetchone()[0]
    tables = connection.execute(
        'SELECT tablename, tableowner FROM pg_tables WHERE schemaname=\'public\' ORDER BY tablename'
    ).fetchall()

app_pool_url = env['DATABASE_URL'].strip().strip('"\'')
with psycopg.connect(app_pool_url) as app_connection:
    app_role = app_connection.execute(
        'SELECT current_user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname=current_user'
    ).fetchone()

print({
    'role': role[0],
    'session_user': role[1],
    'super': role[2],
    'bypass_rls': role[3],
    'nexus_app_exists': nexus_app_exists,
    'tables': tables,
    'app_role': app_role[0],
    'app_super': app_role[1],
    'app_bypass_rls': app_role[2],
})
