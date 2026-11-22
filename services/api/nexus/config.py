from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    auth_mode: Literal['open'] = 'open'
    node_env: Literal['development', 'test', 'production'] = 'development'
    i_understand_open_mode: bool = False
    data_mode: Literal['demo', 'clean'] = 'demo'
    database_url: SecretStr = SecretStr('postgresql+psycopg://nexus_app@127.0.0.1:55432/nexus')
    cors_origins: list[str] = ['http://localhost:3000', 'http://127.0.0.1:3000']
    ai_mode: Literal['deterministic', 'anthropic', 'auto'] = 'deterministic'
    anthropic_model: str = 'claude-sonnet-5-5'
    anthropic_api_key: SecretStr | None = None
    minio_endpoint: str = 'http://127.0.0.1:9000'
    minio_access_key: SecretStr = SecretStr('nexus-local-only')
    minio_secret_key: SecretStr = SecretStr('nexus-local-only-change-me')
    minio_bucket: str = 'nexus-evidence'
    request_limit_per_minute: int = Field(default=120, ge=1, le=10000)

    @model_validator(mode='after')
    def validate_runtime(self) -> 'Settings':
        if self.node_env == 'production' and not self.i_understand_open_mode:
            raise ValueError('Open mode in production requires I_UNDERSTAND_OPEN_MODE=true')
        if not self.database_url.get_secret_value().startswith('postgresql+psycopg://'):
            raise ValueError('DATABASE_URL must use postgresql+psycopg')
        if '*' in self.cors_origins:
            raise ValueError('Explicit CORS origins are required')
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
