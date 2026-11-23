"""Load sourced reference records through the operator connection."""
import json
import os
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import create_engine, text

DEFAULT_PACK = Path(__file__).parent / 'data' / 'reference-data.json'


def stable_id(pack_id: str, section: str, slug: str) -> str:
    return str(uuid5(NAMESPACE_URL, f'apex-nexus:context:{pack_id}:{section}:{slug}'))


def slugify(value: object) -> str:
    import re
    text = str(value).lower().replace('&', 'and')
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')[:200]


def import_payload(pack: dict) -> dict:
    meta = pack.get('meta', {})
    pack_id = meta.get('name', 'Reference register')
    database_url = os.environ.get('MIGRATION_DATABASE_URL')
    if not database_url:
        raise RuntimeError('MIGRATION_DATABASE_URL is required for operator data loading')
    database_url = database_url.strip().strip('"\'')
    if database_url.startswith('postgresql://'):
        database_url = 'postgresql+psycopg://' + database_url[len('postgresql://'):]
    elif database_url.startswith('postgres://'):
        database_url = 'postgresql+psycopg://' + database_url[len('postgres://'):]
    engine = create_engine(database_url)

    with engine.begin() as connection:
        id = stable_id('pack', pack_id, 'pack')
        connection.execute(text('INSERT INTO public_context_pack(id,name,version,as_of,meta) VALUES(:id,:name,:version,:as_of,CAST(:meta AS jsonb)) ON CONFLICT(id) DO UPDATE SET name=excluded.name,version=excluded.version,as_of=excluded.as_of,meta=excluded.meta'), {
            'id': id, 'name': meta.get('name', pack_id), 'version': meta.get('version', 'unknown'),
            'as_of': meta.get('as_of', 'unknown'), 'meta': json.dumps(meta),
        })

        sections = {
            'sources': pack.get('sources', []),
            'directive_cycles': pack.get('directive_cycles', []),
            'oversight_architecture': pack.get('oversight_architecture', []),
            'ministers': pack.get('ministers', []),
            'senior_officials': pack.get('senior_officials', []),
            'unverified_roles': pack.get('unverified_roles', []),
            'directive_themes': pack.get('directive_themes', []),
            'reported_directives': pack.get('reported_directives', []),
            'appointment_events': pack.get('appointment_events', []),
            'public_indicators': pack.get('public_indicators', []),
            'legal_instruments': pack.get('legal_instruments', []),
            'unresolved_legal_instruments': [{'instrument': value} for value in pack.get('unresolved_legal_instruments', [])],
        }
        count = 0
        for section, records in sections.items():
            for record in records:
                if isinstance(record, dict):
                    slug = slugify(record.get('id') or record.get('name') or record.get('short') or record.get('title') or record.get('role') or record.get('indicator') or record.get('theme') or record.get('instrument') or record.get('subject'))
                else:
                    slug = slugify(record)
                source_ids = record.get('source_ids', []) if isinstance(record, dict) else []
                as_of = record.get('as_of') or record.get('date') or meta.get('as_of') if isinstance(record, dict) else meta.get('as_of')
                reverify = bool(record.get('reverify')) if isinstance(record, dict) else False
                provenance = 'reported' if section in {'reported_directives', 'appointment_events'} else 'public_record'
                connection.execute(text('INSERT INTO public_context_record(id,pack_id,section,slug,payload,provenance,source_ids,as_of,reverify) VALUES(:id,:pack_id,:section,:slug,CAST(:payload AS jsonb),:provenance,CAST(:source_ids AS jsonb),:as_of,:reverify) ON CONFLICT(pack_id,section,slug) DO UPDATE SET payload=excluded.payload,provenance=excluded.provenance,source_ids=excluded.source_ids,as_of=excluded.as_of,reverify=excluded.reverify'), {
                    'id': str(uuid5(NAMESPACE_URL, f'apex-nexus:record:{id}:{section}:{slug}')), 'pack_id': id,
                    'section': section, 'slug': slug, 'payload': json.dumps(record), 'provenance': provenance,
                    'source_ids': json.dumps(source_ids), 'as_of': as_of, 'reverify': reverify,
                })
                count += 1
    engine.dispose()
    return {'pack': pack_id, 'records': count, 'sections': len(sections), 'as_of': meta.get('as_of')}


def import_pack(path: Path | None = None) -> dict:
    pack_path = path or DEFAULT_PACK
    if not pack_path.exists():
        raise SystemExit(f'Reference data file not found: {pack_path}')
    return import_payload(json.loads(pack_path.read_text(encoding='utf-8')))


if __name__ == '__main__':
    import sys
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python seed/load_reference_data.py <file.json>')
    print(json.dumps(import_pack(Path(sys.argv[1])), sort_keys=True))
