from dotenv import dotenv_values
import psycopg

env = dotenv_values('.env.local')
url = env['DATABASE_URL_UNPOOLED'].strip().strip('"\'')
with psycopg.connect(url) as connection:
    pack_id = connection.execute(
        'SELECT id FROM public_context_pack WHERE name=%s',
        ('Uganda context smoke pack',),
    ).fetchone()
    if pack_id:
        connection.execute('DELETE FROM public_context_record WHERE pack_id=%s', (pack_id[0],))
        connection.execute('DELETE FROM public_context_pack WHERE id=%s', (pack_id[0],))
print({'smoke_pack_removed': pack_id is not None})
