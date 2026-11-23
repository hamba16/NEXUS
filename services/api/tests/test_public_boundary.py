import httpx
import pytest

from nexus.main import app


@pytest.mark.asyncio
async def test_health_is_minimal_and_operational_paths_require_sign_in():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
        health = await client.get('/healthz')
        assert health.status_code == 200
        assert health.json() == {'status': 'ok'}
        for route in app.routes:
            if route.path == '/healthz':
                continue
            for method in route.methods:
                response = await client.request(method, route.path.replace('{report_id}', '00000000-0000-0000-0000-000000000001'))
                assert response.status_code == 401, (method, route.path, response.status_code)


def test_retired_handlers_are_absent():
    routes = {route.path for route in app.routes}
    assert routes.isdisjoint({'/profiles','/neon/status','/readyz','/metrics','/context/import','/context','/context/packs','/context/{section}'})
