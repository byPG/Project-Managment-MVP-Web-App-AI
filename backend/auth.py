import os
import time

import bcrypt
import jwt

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-only-insecure-secret-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days

COOKIE_NAME = "access_token"
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").lower() == "true"

BCRYPT_ROUNDS = int(os.environ.get("BCRYPT_ROUNDS", "12"))

# bcrypt silently truncates passwords past 72 bytes; callers should also
# enforce this at the Pydantic model level so the truncation is never silent.
MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8")[:MAX_PASSWORD_BYTES], salt).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8")[:MAX_PASSWORD_BYTES],
        hashed_password.encode("utf-8"),
    )


def create_access_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": int(time.time()) + ACCESS_TOKEN_TTL_SECONDS}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None

    subject = payload.get("sub")
    if subject is None:
        return None

    try:
        return int(subject)
    except ValueError:
        return None
