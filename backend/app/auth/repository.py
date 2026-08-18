import uuid
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.auth.models import User, Session, UserPreferences


def utcnow() -> datetime:
    """Return timezone-naive UTC datetime for seamless asyncpg / SQLite TIMESTAMP compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class AuthRepository:
    """Async database repository for Users, Sessions, and Preferences."""

    async def get_user_by_id(self, db: AsyncSession, user_id: str) -> User | None:
        stmt = select(User).where(User.id == user_id).options(selectinload(User.preferences))
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_user_by_email(self, db: AsyncSession, email: str) -> User | None:
        stmt = select(User).where(User.email == email.lower().strip()).options(selectinload(User.preferences))
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    async def create_user(
        self,
        db: AsyncSession,
        email: str,
        password_hash: str,
        display_name: str,
        avatar_url: str | None = None,
    ) -> User:
        uid = str(uuid.uuid4())
        now = utcnow()
        user = User(
            id=uid,
            email=email.lower().strip(),
            password_hash=password_hash,
            display_name=display_name.strip(),
            avatar_url=avatar_url,
            is_active=True,
            created_at=now,
            updated_at=now,
            last_login_at=now,
        )
        db.add(user)

        # Create default preferences
        prefs = UserPreferences(
            user_id=uid,
            response_style="balanced",
            custom_instructions="",
            theme="dark",
            show_citations=True,
            show_tool_activity=True,
            updated_at=now,
        )
        db.add(prefs)

        await db.commit()
        await db.refresh(user)
        return user

    async def update_user_profile(
        self,
        db: AsyncSession,
        user: User,
        display_name: str | None = None,
        avatar_url: str | None = None,
    ) -> User:
        if display_name is not None:
            user.display_name = display_name.strip()
        if avatar_url is not None:
            user.avatar_url = avatar_url
        user.updated_at = utcnow()
        await db.commit()
        await db.refresh(user)
        return user

    async def update_last_login(self, db: AsyncSession, user: User) -> None:
        user.last_login_at = utcnow()
        await db.commit()

    async def create_session(
        self,
        db: AsyncSession,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> Session:
        sid = str(uuid.uuid4())
        now = utcnow()
        # Ensure expires_at is naive for TIMESTAMP WITHOUT TIME ZONE
        exp_naive = expires_at.replace(tzinfo=None) if expires_at.tzinfo else expires_at
        session = Session(
            id=sid,
            user_id=user_id,
            token_hash=token_hash,
            created_at=now,
            last_activity_at=now,
            expires_at=exp_naive,
            is_revoked=False,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    async def get_session_by_token_hash(self, db: AsyncSession, token_hash: str) -> Session | None:
        stmt = (
            select(Session)
            .where(Session.token_hash == token_hash)
            .options(selectinload(Session.user).selectinload(User.preferences))
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_active_sessions_for_user(self, db: AsyncSession, user_id: str) -> list[Session]:
        stmt = (
            select(Session)
            .where(Session.user_id == user_id, Session.is_revoked == False)
            .order_by(Session.last_activity_at.desc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def revoke_session(self, db: AsyncSession, session: Session) -> None:
        session.is_revoked = True
        await db.commit()

    async def revoke_all_user_sessions(self, db: AsyncSession, user_id: str) -> int:
        stmt = (
            update(Session)
            .where(Session.user_id == user_id, Session.is_revoked == False)
            .values(is_revoked=True)
        )
        res = await db.execute(stmt)
        await db.commit()
        return res.rowcount

    async def touch_session_activity(self, db: AsyncSession, session: Session) -> None:
        session.last_activity_at = utcnow()
        await db.commit()

    async def get_user_preferences(self, db: AsyncSession, user_id: str) -> UserPreferences:
        stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
        res = await db.execute(stmt)
        prefs = res.scalar_one_or_none()
        if not prefs:
            prefs = UserPreferences(
                user_id=user_id,
                response_style="balanced",
                custom_instructions="",
                theme="dark",
                show_citations=True,
                show_tool_activity=True,
                updated_at=utcnow(),
            )
            db.add(prefs)
            await db.commit()
            await db.refresh(prefs)
        return prefs

    async def update_user_preferences(
        self,
        db: AsyncSession,
        user_id: str,
        response_style: str | None = None,
        custom_instructions: str | None = None,
        theme: str | None = None,
        show_citations: bool | None = None,
        show_tool_activity: bool | None = None,
    ) -> UserPreferences:
        prefs = await self.get_user_preferences(db, user_id)
        if response_style is not None:
            prefs.response_style = response_style
        if custom_instructions is not None:
            prefs.custom_instructions = custom_instructions
        if theme is not None:
            prefs.theme = theme
        if show_citations is not None:
            prefs.show_citations = show_citations
        if show_tool_activity is not None:
            prefs.show_tool_activity = show_tool_activity
        prefs.updated_at = utcnow()
        await db.commit()
        await db.refresh(prefs)
        return prefs


auth_repo = AuthRepository()
