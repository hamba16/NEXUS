import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'services/api'))
from nexus.main import app  # noqa: E402

destination = root / 'packages/contracts/openapi.json'
destination.write_text(json.dumps(app.openapi(), indent=2) + '\n', encoding='utf-8')
print(destination)
