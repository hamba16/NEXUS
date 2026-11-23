from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=('.env.local', '.env'), extra='ignore',hide_input_in_errors=True)

    node_env: Literal['development', 'test', 'production'] = 'development'
    database_url: SecretStr = SecretStr('postgresql+psycopg://nexus_app@127.0.0.1:55432/nexus')
    cors_origins: list[str] = ['http://localhost:3000', 'http://127.0.0.1:3000']
    request_limit_per_minute: int = Field(default=120, ge=1, le=10000)
    app_origin: str = 'http://localhost:3000'
    mfa_encryption_key: SecretStr = SecretStr('')
    session_signing_key: SecretStr = SecretStr('')
    session_idle_minutes: int = Field(default=20, ge=5, le=60)
    session_absolute_hours: int = Field(default=8, ge=1, le=24)
    support_email: str = ''

    @model_validator(mode='after')
    def validate_runtime(self) -> 'Settings':
        if self.node_env == 'production' and not self.app_origin.startswith('https://'):
            raise ValueError('APP_ORIGIN must use HTTPS in production')
        raw_url = self.database_url.get_secret_value().strip().strip('"\'')
        if raw_url.startswith('postgres://'):
            raw_url = 'postgresql+psycopg://' + raw_url[len('postgres://'):]
        elif raw_url.startswith('postgresql://'):
            raw_url = 'postgresql+psycopg://' + raw_url[len('postgresql://'):]
        elif not raw_url.startswith('postgresql+psycopg://'):
            raise ValueError('DATABASE_URL must use a PostgreSQL URL')
        object.__setattr__(self, 'database_url', SecretStr(raw_url))
        if '*' in self.cors_origins:
            raise ValueError('Explicit CORS origins are required')
        return self

    def validate_auth_keys(self) -> None:
        from cryptography.fernet import Fernet
        if len(self.session_signing_key.get_secret_value()) < 32:
            raise ValueError('SESSION_SIGNING_KEY must contain at least 32 random characters')
        try:
            Fernet(self.mfa_encryption_key.get_secret_value().encode())
        except Exception:
            raise ValueError('MFA_ENCRYPTION_KEY must be a valid Fernet key') from None


@lru_cache
def get_settings() -> Settings:
    return Settings()
