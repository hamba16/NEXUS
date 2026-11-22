"""Create local-only Compose configuration without printing credential values."""
import secrets
from pathlib import Path

root = Path(__file__).resolve().parents[1]
destination = root / '.env'
if destination.exists():
    print('Existing .env preserved.')
else:
    content = (root / '.env.example').read_text()
    for placeholder in ['owner', 'runtime', 'storage']:
        content = content.replace(f'replace-with-random-local-{placeholder}-password', secrets.token_hex(24))
    content = content.replace('I_UNDERSTAND_OPEN_MODE=false','I_UNDERSTAND_OPEN_MODE=true')
    with destination.open('x') as file:
        file.write(content)
    print('Created local demo .env. OPEN ACCESS: anyone can select any profile. Loopback ports only.')
