from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.auth.models import User, Session
from app.auth.service import auth_service


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
    Verify anti-CSRF token on mutating requests (POST, PUT, DELETE).
    Validates that request.headers['x-csrf-token'] matches the 'nexus_csrf' cookie.
    """
    # Safe methods do not require CSRF check
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    csrf_cookie = request.cookies.get("nexus_csrf")
    csrf_header = request.headers.get("x-csrf-token") or request.headers.get("X-CSRF-Token")

    if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF validation failed: X-CSRF-Token header missing or invalid.",
        )
