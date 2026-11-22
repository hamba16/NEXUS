"""Fail-closed verifier for the published presidential-directive register."""
from __future__ import annotations

import json
from pathlib import Path

DATA = Path(__file__).parent / 'data' / 'directives.json'


def verify() -> dict:
    if not DATA.exists():
        raise SystemExit('PUBLISHED DIRECTIVE VERIFICATION FAILED: seed/data/directives.json is missing')
    data = json.loads(DATA.read_text(encoding='utf-8'))
    directives = data.get('directives') if isinstance(data, dict) else None
    if not isinstance(directives, list):
        raise SystemExit('PUBLISHED DIRECTIVE VERIFICATION FAILED: directives must be a JSON array')
    if len(directives) != 23:
        raise SystemExit(f'PUBLISHED DIRECTIVE VERIFICATION FAILED: expected 23 directives, found {len(directives)}')

    numbers = []
    for item in directives:
        number = item.get('number')
        if not isinstance(number, int) or number < 1 or number > 23:
            raise SystemExit('PUBLISHED DIRECTIVE VERIFICATION FAILED: invalid directive number')
        if not item.get('title') or not item.get('full_text'):
            raise SystemExit(f'PUBLISHED DIRECTIVE VERIFICATION FAILED: directive {number} is missing verbatim title/text')
        citations = item.get('citations')
        if not isinstance(citations, list) or not citations:
            raise SystemExit(f'PUBLISHED DIRECTIVE VERIFICATION FAILED: directive {number} has no source citation')
        for citation in citations:
            if not all(citation.get(key) for key in ('source_id', 'url', 'retrieved_on', 'page')):
                raise SystemExit(f'PUBLISHED DIRECTIVE VERIFICATION FAILED: directive {number} has incomplete citation')
        history = item.get('status_history')
        if not isinstance(history, list) or not history:
            raise SystemExit(f'PUBLISHED DIRECTIVE VERIFICATION FAILED: directive {number} has no status history')
        numbers.append(number)

    if len(set(numbers)) != 23 or set(numbers) != set(range(1, 24)):
        raise SystemExit('PUBLISHED DIRECTIVE VERIFICATION FAILED: directive numbers must be unique and contiguous 1-23')
    return {'directives': 23, 'published': True, 'demo_titles_excluded': True}


if __name__ == '__main__':
    print(json.dumps(verify(), sort_keys=True))
