"""Idempotent synthetic profiles for foundation tests; not the published seed gate."""
import os
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import create_engine, text


def stable_id(name: str) -> str:
    return str(uuid5(NAMESPACE_URL, 'apex-nexus:foundation:' + name))


def seed() -> dict:
    migration_url = os.environ.get('MIGRATION_DATABASE_URL') or os.environ.get('DATABASE_URL_UNPOOLED') or os.environ.get('DATABASE_URL')
    if not migration_url:
        raise RuntimeError('MIGRATION_DATABASE_URL, DATABASE_URL_UNPOOLED, or DATABASE_URL is required')
    engine = create_engine(migration_url)
    roles = [('CONVENER', 1), ('SECRETARIAT', 5), ('MDA_OFFICER', 22), ('FIELD_MONITOR', 6), ('ANCHOR_ENTITY', 3), ('OVERSIGHT', 3)]
    first_names = ['Amina', 'Moses', 'Esther', 'Daniel', 'Lydia', 'Peter', 'Grace', 'Robert', 'Sarah', 'Isaac']
    surnames = ['Namuli', 'Ocen', 'Kato', 'Auma', 'Waiswa', 'Nabirye', 'Okello', 'Atim', 'Kakande', 'Ssenyonga']
    with engine.begin() as conn:
        for i in range(25):
            conn.execute(text("INSERT INTO institution(id,name,provenance,source) VALUES (:id,:name,'simulated','{}') ON CONFLICT(id) DO NOTHING"), {'id': stable_id(f'institution-{i}'), 'name': f'Synthetic institution {i + 1:02d}'})
        number = 0
        for role, count in roles:
            for i in range(count):
                institution = i + 1 if role == 'MDA_OFFICER' else 0
                conn.execute(text('INSERT INTO profile(id,name,role,institution_id,is_simulated,active) VALUES (:id,:name,:role,:institution,true,true) ON CONFLICT(id) DO NOTHING'), {'id': stable_id(f'{role}-{i}'), 'name': f'{first_names[number % 10]} {surnames[(number // 10 + number) % 10]} (test {number + 1:02d})', 'role': role, 'institution': stable_id(f'institution-{institution}')})
                number += 1
    engine.dispose()
    return {'profiles': number, 'institutions': 25, 'provenance': 'simulated', 'published_seed': False}


if __name__ == '__main__':
    print(seed())
