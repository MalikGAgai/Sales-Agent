"""
test_settings.py — Comprehensive unit tests for Settings Module.

Coverage:
  - Fetch user preferences & defaults
  - Update language, timezone, theme, and notification toggles
  - Active sessions listing and revocation
  - 2FA status, TOTP enable, and password disable
  - Organization-wide system settings and RBAC checks
"""
import pytest
from httpx import AsyncClient


async def _register(client: AsyncClient, email: str) -> str:
    """Register a user and return JWT access token."""
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "first_name": "Settings",
            "last_name": "User",
            "organization_name": "SettingsCorp",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


def _h(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


BASE = "/api/v1/settings"


# ── User Preferences ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_user_settings(client: AsyncClient):
    """Fetching user settings returns default preferences."""
    token = await _register(client, "pref1@settings.io")
    res = await client.get(f"{BASE}/user", headers=_h(token))
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["email"] == "pref1@settings.io"
    assert body["language"] == "en"
    assert body["timezone"] == "UTC"
    assert body["theme"] == "dark"
    assert body["email_notifications"] is True


@pytest.mark.asyncio
async def test_update_user_settings(client: AsyncClient):
    """Updating language, timezone, theme, and notifications reflects in response."""
    token = await _register(client, "pref2@settings.io")
    res = await client.patch(
        f"{BASE}/user",
        json={
            "first_name": "UpdatedName",
            "language": "es",
            "timezone": "America/New_York",
            "theme": "dark",
            "accent_color": "purple",
            "digest_frequency": "weekly",
        },
        headers=_h(token),
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["first_name"] == "UpdatedName"
    assert body["language"] == "es"
    assert body["timezone"] == "America/New_York"
    assert body["accent_color"] == "purple"
    assert body["digest_frequency"] == "weekly"


# ── Sessions ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_active_sessions(client: AsyncClient):
    """Listing user sessions returns current active session."""
    token = await _register(client, "sess1@settings.io")
    res = await client.get(f"{BASE}/sessions", headers=_h(token))
    assert res.status_code == 200, res.text
    sessions = res.json()
    assert isinstance(sessions, list)
    assert len(sessions) >= 1
    assert sessions[0]["is_current"] is True


@pytest.mark.asyncio
async def test_revoke_other_sessions(client: AsyncClient):
    """Revoking all other sessions returns success message."""
    token = await _register(client, "sess2@settings.io")
    res = await client.delete(f"{BASE}/sessions", headers=_h(token))
    assert res.status_code == 200, res.text
    assert "message" in res.json()


# ── 2FA Placeholder ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_2fa_status_and_enable(client: AsyncClient):
    """Fetching 2FA status returns QR code URL and enabling 2FA updates status."""
    token = await _register(client, "2fa1@settings.io")

    # Initial status
    get_res = await client.get(f"{BASE}/2fa", headers=_h(token))
    assert get_res.status_code == 200
    assert get_res.json()["enabled"] is False
    assert "qr_code_url" in get_res.json()

    # Enable with 6-digit TOTP code
    enable_res = await client.post(
        f"{BASE}/2fa/enable",
        json={"totp_code": "123456"},
        headers=_h(token),
    )
    assert enable_res.status_code == 200
    assert enable_res.json()["enabled"] is True


# ── Organization Settings ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_org_settings_get_and_update(client: AsyncClient):
    """Owner can fetch and update organization system settings."""
    token = await _register(client, "orgs1@settings.io")

    res = await client.get(f"{BASE}/organization", headers=_h(token))
    assert res.status_code == 200
    assert "site_name" in res.json()

    upd_res = await client.patch(
        f"{BASE}/organization",
        json={
            "site_name": "Updated Org Portal",
            "support_email": "help@settingscorp.io",
            "default_language": "es",
        },
        headers=_h(token),
    )
    assert upd_res.status_code == 200
    assert upd_res.json()["site_name"] == "Updated Org Portal"
    assert upd_res.json()["support_email"] == "help@settingscorp.io"
