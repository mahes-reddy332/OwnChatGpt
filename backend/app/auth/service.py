from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.models import User, Session, UserPreferences
from app.auth.repository import auth_repo
from app.auth.security import hash_password, verify_password, generate_opaque_token, hash_token, generate_csrf_token
from app.core.config import get_settings

settings = get_settings()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AuthService:
    """Business logic service for user authentication and session lifecycle management."""

    async def signup(
        self,
        db: AsyncSession,
        email: str,
        password: str,
        display_name: str,
        avatar_url: str | None = None,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> tuple[User, str, str]:
        existing = await auth_repo.get_user_by_email(db, email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists.",
            )

        pwd_hash = hash_password(password)
        user = await auth_repo.create_user(db, email, pwd_hash, display_name, avatar_url)

        # Create session
        raw_token = generate_opaque_token()
        token_h = hash_token(raw_token)
        expires_at = utcnow() + timedelta(days=settings.AUTH_SESSION_MAX_DAYS)
        await auth_repo.create_session(db, user.id, token_h, expires_at, user_agent, ip_address)

        csrf_token = generate_csrf_token()
        return user, raw_token, csrf_token

    async def login(
        self,
        db: AsyncSession,
        email: str,
        password: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> tuple[User, str, str]:
        user = await auth_repo.get_user_by_email(db, email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated.",
            )

        await auth_repo.update_last_login(db, user)

        # Issue new session
        raw_token = generate_opaque_token()
        token_h = hash_token(raw_token)
        expires_at = utcnow() + timedelta(days=settings.AUTH_SESSION_MAX_DAYS)
        await auth_repo.create_session(db, user.id, token_h, expires_at, user_agent, ip_address)

        csrf_token = generate_csrf_token()
        return user, raw_token, csrf_token

    async def validate_session(self, db: AsyncSession, raw_token: str | None) -> tuple[User, Session]:
        """
        Authoritatively validate the session.
        Enforces revocation, absolute 7-day expiration, and 30-minute idle expiration.
        DOES NOT touch or mutate last_activity_at.
        """
        if not raw_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required. Please log in.",
            )

        token_h = hash_token(raw_token)
        session = await auth_repo.get_session_by_token_hash(db, token_h)

        if not session or session.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session is invalid or has been revoked.",
            )

        now = utcnow()

        # Check absolute session expiration (Hard cutoff: 7 days)
        # Normalise timezone
        exp = session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at.tzinfo is None else session.expires_at
        if now > exp:
            await auth_repo.revoke_session(db, session)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has reached maximum lifetime (7 days). Please log in again.",
            )

        # Check idle timeout (30 minutes)
        last_act = session.last_activity_at.replace(tzinfo=timezone.utc) if session.last_activity_at.tzinfo is None else session.last_activity_at
        idle_seconds = (now - last_act).total_seconds()
        if idle_seconds > (settings.AUTH_IDLE_TIMEOUT_MINUTES * 60):
            await auth_repo.revoke_session(db, session)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Session expired due to {settings.AUTH_IDLE_TIMEOUT_MINUTES} minutes of inactivity.",
            )

        if not session.user or not session.user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

        return session.user, session

    async def touch_session(self, db: AsyncSession, session: Session) -> None:
        """
        Extend idle timeout on explicitly defined meaningful activity.
        Throttled to update DB at most once every 60 seconds.
        """
        now = utcnow()
        last_act = session.last_activity_at.replace(tzinfo=timezone.utc) if session.last_activity_at.tzinfo is None else session.last_activity_at
        if (now - last_act).total_seconds() > 60:
            await auth_repo.touch_session_activity(db, session)

    async def logout(self, db: AsyncSession, raw_token: str | None) -> bool:
        if not raw_token:
            return False
        token_h = hash_token(raw_token)
        session = await auth_repo.get_session_by_token_hash(db, token_h)
        if session:
            await auth_repo.revoke_session(db, session)
            return True
        return False

    async def logout_all(self, db: AsyncSession, user_id: str) -> int:
        return await auth_repo.revoke_all_user_sessions(db, user_id)

    async def get_active_sessions(self, db: AsyncSession, user_id: str, current_token: str | None) -> list[dict]:
        sessions = await auth_repo.get_active_sessions_for_user(db, user_id)
        current_h = hash_token(current_token) if current_token else None
        return [
            {
                "id": s.id,
                "created_at": s.created_at.isoformat(),
                "last_activity_at": s.last_activity_at.isoformat(),
                "expires_at": s.expires_at.isoformat(),
                "is_current": s.token_hash == current_h,
                "user_agent": s.user_agent,
                "ip_address": s.ip_address,
            }
            for s in sessions
        ]


auth_service = AuthService()
