from fastapi import APIRouter, Depends, Response, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.auth.models import User, Session
from app.auth.schemas import (
    SignupRequest,
    LoginRequest,
    UserProfileResponse,
    ProfileUpdateRequest,
    UserPreferencesResponse,
    UserPreferencesUpdateRequest,
    SessionResponse,
    ForgotPasswordRequest,
    GenericMessageResponse,
)
from app.auth.service import auth_service
from app.auth.repository import auth_repo
from app.auth.dependencies import (
    get_current_user,
    get_current_user_and_session,
    get_session_token,
    verify_csrf_token,
)
from app.core.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["authentication"])


def _set_auth_cookies(response: Response, raw_token: str, csrf_token: str) -> None:
    """Set HttpOnly session cookie and accessible CSRF token cookie."""
    # 7-day max-age in seconds
    max_age = settings.AUTH_SESSION_MAX_DAYS * 24 * 60 * 60

    response.set_cookie(
        key="nexus_session",
        value=raw_token,
        max_age=max_age,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/",
    )
    response.set_cookie(
        key="nexus_csrf",
        value=csrf_token,
        max_age=max_age,
        httponly=False,  # Frontend reads this to send X-CSRF-Token header
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    """Clear session and CSRF cookies on logout."""
    response.delete_cookie(key="nexus_session", path="/")
    response.delete_cookie(key="nexus_csrf", path="/")


@router.post("/signup", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignupRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Public registration endpoint (CSRF Exempt).
    Creates a new user account and establishes a session.
    """
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    user, raw_token, csrf_token = await auth_service.signup(
        db=db,
        email=payload.email,
        password=payload.password,
        display_name=payload.display_name,
        avatar_url=payload.avatar_url,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    _set_auth_cookies(response, raw_token, csrf_token)

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
        last_login_at=user.last_login_at.isoformat() if user.last_login_at else None,
    )


@router.post("/login", response_model=UserProfileResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Public login endpoint (CSRF Exempt).
    Validates credentials, creates a new session, and sets cookies.
    """
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    user, raw_token, csrf_token = await auth_service.login(
        db=db,
        email=payload.email,
        password=payload.password,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    _set_auth_cookies(response, raw_token, csrf_token)

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
        last_login_at=user.last_login_at.isoformat() if user.last_login_at else None,
    )


@router.post("/logout", response_model=GenericMessageResponse)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Revoke current session and clear auth cookies.
    """
    raw_token = get_session_token(request)
    await auth_service.logout(db, raw_token)
    _clear_auth_cookies(response)
    return GenericMessageResponse(message="Successfully logged out.")


@router.post("/logout-all", response_model=GenericMessageResponse)
async def logout_all(
    response: Response,
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Revoke all active sessions for the user across all devices.
    """
    user, _ = auth_ctx
    count = await auth_service.logout_all(db, user.id)
    _clear_auth_cookies(response)
    return GenericMessageResponse(message=f"Successfully revoked all {count} active sessions.")


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    user: User = Depends(get_current_user),
):
    """
    Get the authenticated user's profile and metadata.
    """
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
        last_login_at=user.last_login_at.isoformat() if user.last_login_at else None,
    )


@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    payload: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Update display name or avatar URL for the current user.
    """
    updated = await auth_repo.update_user_profile(
        db=db,
        user=user,
        display_name=payload.display_name,
        avatar_url=payload.avatar_url,
    )
    return UserProfileResponse(
        id=updated.id,
        email=updated.email,
        display_name=updated.display_name,
        avatar_url=updated.avatar_url,
        is_active=updated.is_active,
        created_at=updated.created_at.isoformat(),
        last_login_at=updated.last_login_at.isoformat() if updated.last_login_at else None,
    )


@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_preferences(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user AI response preferences and personalization settings.
    """
    prefs = await auth_repo.get_user_preferences(db, user.id)
    return UserPreferencesResponse(
        response_style=prefs.response_style,
        custom_instructions=prefs.custom_instructions,
        theme=prefs.theme,
        show_citations=prefs.show_citations,
        show_tool_activity=prefs.show_tool_activity,
    )


@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_preferences(
    payload: UserPreferencesUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Save user AI response preferences and personalization settings.
    """
    prefs = await auth_repo.update_user_preferences(
        db=db,
        user_id=user.id,
        response_style=payload.response_style,
        custom_instructions=payload.custom_instructions,
        theme=payload.theme,
        show_citations=payload.show_citations,
        show_tool_activity=payload.show_tool_activity,
    )
    return UserPreferencesResponse(
        response_style=prefs.response_style,
        custom_instructions=prefs.custom_instructions,
        theme=prefs.theme,
        show_citations=prefs.show_citations,
        show_tool_activity=prefs.show_tool_activity,
    )


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    request: Request,
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
):
    """
    List all active sessions for the user to review active devices.
    """
    user, _ = auth_ctx
    raw_token = get_session_token(request)
    sessions = await auth_service.get_active_sessions(db, user.id, raw_token)
    return [SessionResponse(**s) for s in sessions]


@router.post("/touch-session", response_model=GenericMessageResponse)
async def touch_session(
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Explicitly extend session idle timeout (e.g. user clicks 'Stay signed in' on expiry modal).
    """
    _, session = auth_ctx
    await auth_service.touch_session(db, session)
    return GenericMessageResponse(message="Session successfully refreshed.")


@router.post("/forgot-password", response_model=GenericMessageResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
):
    """
    Password reset request stub (CSRF Exempt).
    Returns a generic message to prevent email enumeration.
    """
    return GenericMessageResponse(
        message="If this email is registered in our system, password reset instructions have been dispatched."
    )
