import uuid
import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.auth.models import User, Session
from app.database.session import AsyncSessionLocal, init_db
from app.auth.security import hash_password, hash_token, generate_opaque_token


def test_auth_flow_and_isolation(unauthenticated_client: TestClient):
    client = unauthenticated_client
    email_a = f"user_a_{uuid.uuid4().hex[:8]}@example.com"
    email_b = f"user_b_{uuid.uuid4().hex[:8]}@example.com"

    # 1. Signup User A
    signup_res_a = client.post(
        "/api/auth/signup",
        json={
            "email": email_a,
            "password": "Password123!",
            "display_name": "User Alpha",
        },
    )
    assert signup_res_a.status_code == 201
    data_a = signup_res_a.json()
    assert data_a["email"] == email_a
    assert data_a["display_name"] == "User Alpha"
    user_a_id = data_a["id"]

    # Check cookies
    cookies_a = signup_res_a.cookies
    assert "nexus_session" in cookies_a
    assert "nexus_csrf" in cookies_a
    csrf_a = cookies_a["nexus_csrf"]

    # 2. Get User A Profile
    me_res_a = client.get("/api/auth/me")
    assert me_res_a.status_code == 200
    assert me_res_a.json()["id"] == user_a_id

    # 3. User A creates a Thread (with CSRF header)
    thread_res_a = client.post(
        "/api/threads",
        json={"title": "Alpha Confidential Plan"},
        headers={"x-csrf-token": csrf_a},
    )
    assert thread_res_a.status_code == 200
    thread_a_id = thread_res_a.json()["id"]

    # 4. User A stores a Memory
    mem_res_a = client.post(
        "/api/memory",
        json={"text": "User A secret identity: Nightwing", "category": "fact"},
        headers={"x-csrf-token": csrf_a},
    )
    assert mem_res_a.status_code == 200

    # 5. Test CSRF Protection: Attempt mutating call without CSRF token
    no_csrf_res = client.post(
        "/api/threads",
        json={"title": "Should Fail"},
    )
    assert no_csrf_res.status_code == 403

    # 6. Logout User A
    logout_res = client.post(
        "/api/auth/logout",
        headers={"x-csrf-token": csrf_a},
    )
    assert logout_res.status_code == 200

    # 7. New client session: Register User B
    client_b = TestClient(app)
    signup_res_b = client_b.post(
        "/api/auth/signup",
        json={
            "email": email_b,
            "password": "Password456!",
            "display_name": "User Beta",
        },
    )
    assert signup_res_b.status_code == 201
    data_b = signup_res_b.json()
    assert data_b["email"] == email_b
    csrf_b = signup_res_b.cookies["nexus_csrf"]

    # 8. User Isolation Check: User B lists threads -> must NOT see User A's thread
    threads_list_b = client_b.get("/api/threads")
    assert threads_list_b.status_code == 200
    b_threads = threads_list_b.json()
    assert all(t["id"] != thread_a_id for t in b_threads)

    # 9. User Isolation Check: User B attempts direct GET on User A's thread -> 404
    direct_thread_b = client_b.get(f"/api/threads/{thread_a_id}")
    assert direct_thread_b.status_code == 404

    # 10. User Isolation Check: User B attempts direct DELETE on User A's thread -> 404
    delete_thread_b = client_b.delete(
        f"/api/threads/{thread_a_id}",
        headers={"x-csrf-token": csrf_b},
    )
    assert delete_thread_b.status_code == 404

    # 11. User Isolation Check: User B lists memories -> must NOT see User A's secret memory
    mem_list_b = client_b.get("/api/memory")
    assert mem_list_b.status_code == 200
    b_memories = mem_list_b.json()
    assert all("Nightwing" not in m["text"] for m in b_memories)

    # 12. User B Preferences update
    pref_update = client_b.put(
        "/api/auth/preferences",
        json={"response_style": "concise", "theme": "light"},
        headers={"x-csrf-token": csrf_b},
    )
    assert pref_update.status_code == 200
    assert pref_update.json()["response_style"] == "concise"
    assert pref_update.json()["theme"] == "light"

    # 13. Forgot Password Dev Stub
    forgot_res = client_b.post(
        "/api/auth/forgot-password",
        json={"email": email_b},
    )
    assert forgot_res.status_code == 200
    assert "password reset instructions" in forgot_res.json()["message"].lower()


def test_auth_idle_timeout_rejection():
    """Verify that a session past AUTH_IDLE_TIMEOUT_MINUTES is rejected with 401."""
    u_id = f"idle_u_{uuid.uuid4().hex[:8]}"
    s_id = f"idle_s_{uuid.uuid4().hex[:8]}"

    async def create_expired_session():
        await init_db()
        async with AsyncSessionLocal() as db:
            pwd_h = hash_password("TimeoutPass123!")
            user = User(
                id=u_id,
                email=f"{u_id}@example.com",
                password_hash=pwd_h,
                display_name="Idle Tester",
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(user)

            raw_tok = generate_opaque_token()
            tok_h = hash_token(raw_tok)
            past_activity = datetime.now(timezone.utc) - timedelta(minutes=40)
            exp = datetime.now(timezone.utc) + timedelta(days=7)
            session = Session(
                id=s_id,
                user_id=u_id,
                token_hash=tok_h,
                created_at=past_activity,
                last_activity_at=past_activity,
                expires_at=exp,
                is_revoked=False,
            )
            db.add(session)
            await db.commit()
            return raw_tok

    raw_tok = asyncio.run(create_expired_session())

    client = TestClient(app)
    client.cookies.set("nexus_session", raw_tok)
    res = client.get("/api/auth/me")
    assert res.status_code == 401
    assert "inactivity" in res.json()["detail"].lower()
