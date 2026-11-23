import hashlib
import hmac
import secrets
import time
from datetime import UTC, datetime

import pyotp
from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHashError, VerificationError
from cryptography.fernet import Fernet

from .config import get_settings

password_hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=1, type=Type.ID)
dummy_hash = password_hasher.hash(secrets.token_urlsafe(32))
SESSION_COOKIE = '__Host-nexus_session'
LOGIN_COOKIE = '__Host-nexus_login'


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def password_hash(password: str) -> str:
    validate_password(password)
    return password_hasher.hash(password)


def validate_password(password: str) -> None:
    if not 14 <= len(password) <= 128:
        raise ValueError('Use a password between 14 and 128 characters.')
    if len(set(password)) < 6 or password.casefold() in {'password123456', 'administrator123', 'changeme1234567'}:
        raise ValueError('Choose a less predictable password or a longer passphrase.')


def password_matches(encoded: str, candidate: str) -> bool:
    try:
        return password_hasher.verify(encoded, candidate)
    except (VerificationError, InvalidHashError):
        return False


def cipher() -> Fernet:
    return Fernet(get_settings().mfa_encryption_key.get_secret_value().encode())


def csrf_token(session_token: str) -> str:
    return hmac.new(get_settings().session_signing_key.get_secret_value().encode(), ('csrf:' + session_token).encode(), hashlib.sha256).hexdigest()


def login_nonce() -> str:
    value = f'{int(time.time())}.{secrets.token_urlsafe(24)}'
    return value + '.' + csrf_token(value)


def valid_login_nonce(value: str) -> bool:
    try:
        timestamp, random, signature = value.split('.')
        return 0 <= time.time() - int(timestamp) <= 300 and hmac.compare_digest(signature, csrf_token(timestamp + '.' + random))
    except (ValueError, TypeError):
        return False


def totp_counter(secret: str, code: str, last_counter: int) -> int | None:
    if len(code) != 6 or not code.isdigit():
        return None
    counter = int(time.time()) // 30
    otp = pyotp.TOTP(secret)
    for candidate in (counter - 1, counter, counter + 1):
        if candidate > last_counter and hmac.compare_digest(otp.at(candidate * 30), code):
            return candidate
    return None


def recovery_hash(code: str) -> str:
    return hmac.new(get_settings().session_signing_key.get_secret_value().encode(), ('recovery:' + code.strip()).encode(), hashlib.sha256).hexdigest()


def utcnow() -> datetime:
    return datetime.now(UTC)
