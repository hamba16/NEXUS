import httpx
import pytest

from nexus.main import app


@pytest.mark.asyncio
async def test_health_is_minimal_and_operational_paths_require_sign_in():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        health = await client.get('/healthz')
        assert health.status_code == 200
        assert health.json() == {'status': 'ok'}
        for path, operations in app.openapi()['paths'].items():
            if path in {'/healthz','/auth/csrf','/auth/login'}:
                continue
            for method in operations:
                target=path.replace('{report_id}', '00000000-0000-0000-0000-000000000001').replace('{account_id}','00000000-0000-0000-0000-000000000001')
                response = await client.request(method, target)
                assert response.status_code == 401, (method, path, response.status_code)


def test_retired_handlers_are_absent():
    routes = set(app.openapi()['paths'])
    assert routes.isdisjoint({'/profiles','/neon/status','/readyz','/metrics','/context/import','/context','/context/packs','/context/{section}'})
