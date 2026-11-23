from secrets import token_urlsafe
from urllib.parse import urlsplit, urlunsplit, quote

import psycopg
from psycopg import sql
from dotenv import dotenv_values


env_path = '.env.local'
env = dotenv_values(env_path)
direct_url = env['DATABASE_URL_UNPOOLED'].strip().strip('"\'')
pool_url = env['DATABASE_URL'].strip().strip('"\'')
password = token_urlsafe(32)

with psycopg.connect(direct_url) as connection:
    connection.execute(sql.SQL("ALTER ROLE {} LOGIN PASSWORD {}").format(sql.Identifier("nexus_app"), sql.Literal(password)))


def app_url(base_url: str) -> str:
    parsed = urlsplit(base_url)
    host = parsed.hostname or ''
    auth = f'nexus_app:{quote(password, safe="")}'
    if parsed.port:
        netloc = f'{auth}@{host}:{parsed.port}'
    else:
        netloc = f'{auth}@{host}'
    return urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment))

pool_app_url = app_url(pool_url)
direct_app_url = app_url(direct_url)

lines = open(env_path, 'r', encoding='utf-8').readlines()
updates = {
    'DATABASE_URL': pool_app_url,
    'DATABASE_URL_UNPOOLED': direct_app_url,
    'APP_DATABASE_PASSWORD': password,
}
seen = set()
result = []
for line in lines:
    key = line.split('=', 1)[0].strip() if '=' in line else None
    if key in updates:
        result.append(f'{key}={updates[key]}\n')
        seen.add(key)
    else:
        result.append(line)
for key in updates:
    if key not in seen:
        result.append(f'{key}={updates[key]}\n')
with open(env_path, 'w', encoding='utf-8', newline='') as file:
    file.writelines(result)

print({
    'role': 'nexus_app',
    'login': 'configured',
    'pooled_url': 'updated',
    'direct_url': 'updated',
})
