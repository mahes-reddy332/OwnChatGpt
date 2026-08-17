import hashlib
import secrets
import bcrypt


def hash_password(password: str) -> str:
    """Hash a plaintext password securely using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    pwd_bytes = password.encode("utf-8")
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash in constant time."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def generate_opaque_token() -> str:
    """Generate a 32-byte cryptographically secure URL-safe opaque token."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Compute SHA-256 hash of an opaque token for secure database storage and indexing."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_csrf_token() -> str:
    """Generate a random 24-byte anti-CSRF token."""
    return secrets.token_urlsafe(24)
