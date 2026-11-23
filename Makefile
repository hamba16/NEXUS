PYTHON ?= python
COMPOSE = docker compose --env-file .env -f infra/compose.yaml
.PHONY: demo up down seed test e2e lint build contracts
demo:
	$(PYTHON) scripts/configure_demo.py
	$(COMPOSE) up --build -d --wait
	@echo Open http://localhost:3000 - OPEN ACCESS FOUNDATION, not a production release.
up:
	$(COMPOSE) up -d --wait
down:
	$(COMPOSE) down
seed:
	$(COMPOSE) run --rm seed
verify-seed:
	$(PYTHON) seed/verify_directives.py
import-context:
	$(PYTHON) -c "import os,sys; sys.path.insert(0,'.'); from seed.import_context_pack import import_pack; print(import_pack(__import__('pathlib').Path(os.environ.get('PACK','seed/data/uganda-context-pack.json'))))"
test:
	$(PYTHON) -m pytest services/api/tests
e2e:
	npm run test:e2e
lint:
	npx eslint apps/web/app --ext .ts,.tsx
	$(PYTHON) -m ruff check services/api seed/foundation.py scripts/export_openapi.py
	$(PYTHON) -m mypy services/api/nexus
build:
	npm run build
contracts:
	npm run contracts
