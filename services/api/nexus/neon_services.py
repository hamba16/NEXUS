import asyncio
import uuid

import boto3
import httpx
from botocore.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings


async def postgres_status(session: AsyncSession) -> dict:
    await session.execute(text('SELECT 1'))
    return {'ok': True}


async def function_status() -> dict:
    settings = get_settings()
    if not settings.neon_branch_id or not settings.neon_function_host_suffix:
        return {'ok': False, 'detail': 'Neon Function variables are missing'}
    url = f'https://{settings.neon_branch_id}-hello{settings.neon_function_host_suffix}/'
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url)
    return {'ok': response.status_code == 200, 'status': response.status_code, 'detail': response.text[:120]}


async def object_storage_status() -> dict:
    settings = get_settings()
    if not all((settings.aws_access_key_id, settings.aws_secret_access_key, settings.aws_endpoint_url_s3, settings.aws_region)):
        return {'ok': False, 'detail': 'Neon Object Storage variables are missing'}

    def probe() -> dict:
        s3 = boto3.client(
            's3',
            endpoint_url=settings.aws_endpoint_url_s3,
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id.get_secret_value() if settings.aws_access_key_id else None,
            aws_secret_access_key=settings.aws_secret_access_key.get_secret_value() if settings.aws_secret_access_key else None,
            config=Config(s3={'addressing_style': 'path'}),
        )
        key = f'neon-health/{uuid.uuid4().hex}.txt'
        s3.put_object(Bucket='assets', Key=key, Body=b'APEX NEXUS Neon health check', ContentType='text/plain')
        body = s3.get_object(Bucket='assets', Key=key)['Body'].read()
        s3.delete_object(Bucket='assets', Key=key)
        return {'ok': body == b'APEX NEXUS Neon health check', 'operations': ['put', 'get', 'delete']}

    return await asyncio.to_thread(probe)


async def ai_gateway_status() -> dict:
    settings = get_settings()
    if not settings.neon_ai_gateway_token or not settings.neon_ai_gateway_base_url:
        return {'ok': False, 'detail': 'Neon AI Gateway variables are missing'}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            f'{settings.neon_ai_gateway_base_url.rstrip("/")}/v1/models',
            headers={'Authorization': f'Bearer {settings.neon_ai_gateway_token.get_secret_value()}'},
        )
    payload = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
    models = payload.get('data', [])
    enabled = [model for model in models if model.get('enabled') is True]
    if response.status_code == 200:
        return {'ok': True, 'status': response.status_code, 'catalog_models': len(models), 'enabled_models': len(enabled)}
    return {'ok': False, 'status': response.status_code, 'detail': payload.get('unavailable_reason', 'Model catalog unavailable')}


async def realtime_status() -> dict:
    settings = get_settings()
    if not settings.neon_realtime_url or not settings.neon_realtime_secret:
        return {'ok': False, 'detail': 'Neon Realtime variables are missing'}
    url = settings.neon_realtime_url.strip()
    probe_url = 'https://' + url.split('://', 1)[1] if url.startswith('wss://') else url
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(probe_url)
        reachable = response.status_code < 500
    except httpx.HTTPError:
        reachable = False
        response_status = None
    else:
        response_status = response.status_code
    return {'ok': reachable, 'status': response_status, 'configured': True}
