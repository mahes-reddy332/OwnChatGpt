from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.auth.models import User, Session
from app.auth.service import auth_service
from app.core.config import get_settings

settings = get_settings()


def get_cors_origins() -> list[str]:
    """Build CORS origins list combining defaults and configured origins."""
    origins = [
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://nexus-nine-flax-34.vercel.app",
    ]
    if settings.CORS_ALLOWED_ORIGINS:
        for orig in settings.CORS_ALLOWED_ORIGINS.split(","):
            cleaned = orig.strip()
            if cleaned and cleaned not in origins:
                origins.append(cleaned)
    return origins


def get_session_token(request: Request) -> str | None:
    """
    Extract the session token exclusively from the HttpOnly 'nexus_session' cookie.
    """
    return request.cookies.get("nexus_session")


async def get_current_user_and_session(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> tuple[User, Session]:
    """
    Authoritatively validate the session from the cookie without extending activity.
    Raises HTTP 401 if invalid or expired.
    """
    token = get_session_token(request)
    return await auth_service.validate_session(db, token)


async def get_current_user(
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
) -> User:
    """Dependency returning the authenticated User object."""
    user, _ = auth_ctx
    return user


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Dependency returning the User if authenticated, or None."""
    token = get_session_token(request)
    if not token:
        return None
    try:
        user, _ = await auth_service.validate_session(db, token)
        return user
    except Exception:
        return None


def verify_csrf_token(request: Request) -> None:
    """
    Verify anti-CSRF protection on mutating requests (POST, PUT, DELETE, PATCH).
    Follows OWASP CSRF Defense guidelines:
    1. Safe methods (GET, HEAD, OPTIONS) are exempt.
    2. Origin / Referer validation against whitelist of trusted frontend domains.
    3. Double-submit cookie check if X-CSRF-Token is present.
    """
    # Safe methods do not require CSRF check
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    allowed_origins = get_cors_origins()
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")

    # 1. Verify Origin header matches authorized frontend
    if origin:
        if origin in allowed_origins or "*" in allowed_origins:
            return

    # 2. Check Referer header if Origin is not sent
    if referer:
        if any(referer.startswith(allowed) for allowed in allowed_origins):
            return

    # 3. Check double-submit cookie matching
    csrf_cookie = request.cookies.get("nexus_csrf")
    csrf_header = request.headers.get("x-csrf-token") or request.headers.get("X-CSRF-Token")

    if csrf_cookie and csrf_header and csrf_cookie == csrf_header:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="CSRF validation failed: Unauthorized request origin.",
    )
