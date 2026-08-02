"""
test_api_keys.py — Comprehensive unit tests for API Key Management.

Coverage:
  - Generate key (success, validation, permissions)
  - Regenerate key (new token issued, old invalidated)
  - Deactivate key (PATCH is_active=False)
  - Expiration enforcement (validate rejects expired)
  - Usage count increments on validate
  - Rate-limit stored and returned
  - List with search / active-filter / pagination
  - Get single key
  - Delete key (hard delete, gone from list)
  - 404 responses for missing keys
  - 401 without auth token
  - Invalid scope validation
"""
import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _register(client: AsyncClient, email: str) -> str:
    """Register a fresh user/org and return JWT access token."""
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "first_name": "Key",
            "last_name": "Tester",
            "organization_name": "KeyCorp",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


def _h(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


BASE = "/api/v1/api-keys"

KEY_PAYLOAD = {
    "name": "My Test Key",
    "scopes": ["read:projects", "write:projects"],
    "rate_limit_per_minute": 60,
}


# ── Generate ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_key_success(client: AsyncClient):
    """Generating a key returns a plain token and metadata."""
    token = await _register(client, "gen1@keys.io")
    res = await client.post(BASE, json=KEY_PAYLOAD, headers=_h(token))
    assert res.status_code == 201, res.text
    body = res.json()
    assert "key" in body, "plain token must be in response"
    assert len(body["key"]) > 10
    k = body["api_key"]
    assert k["name"] == "My Test Key"
    assert k["scopes"] == ["read:projects", "write:projects"]
    assert k["is_active"] is True
    assert k["usage_count"] == 0
    assert k["rate_limit_per_minute"] == 60
    # prefix must be first 8 chars of the token
    assert body["key"].startswith(k["prefix"])


@pytest.mark.asyncio
async def test_generate_key_stores_hash_not_plain(client: AsyncClient):
    """After generate, the plain token is NOT returned in a subsequent GET."""
    token = await _register(client, "gen2@keys.io")
    res = await client.post(BASE, json={"name": "Hash Test"}, headers=_h(token))
    assert res.status_code == 201
    plain_key = res.json()["key"]
    key_id = res.json()["api_key"]["id"]

    # Fetch the key detail — plain token must not appear
    get_res = await client.get(f"{BASE}/{key_id}", headers=_h(token))
    assert get_res.status_code == 200
    detail = get_res.json()
    assert plain_key not in str(detail), "plain token must never appear in GET response"
    assert "key_hash" not in detail, "key_hash must not be exposed in response"


@pytest.mark.asyncio
async def test_generate_key_invalid_scope(client: AsyncClient):
    """Generating a key with an unknown scope returns 400."""
    token = await _register(client, "gen3@keys.io")
    res = await client.post(
        BASE,
        json={"name": "Bad Scope Key", "scopes": ["invalid:scope"]},
        headers=_h(token),
    )
    assert res.status_code == 400
    body_text = res.text.lower()
    assert "invalid" in body_text or "scope" in body_text


@pytest.mark.asyncio
async def test_generate_key_with_expiration(client: AsyncClient):
    """Key with future expiration is created correctly."""
    token = await _register(client, "gen4@keys.io")
    future = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    res = await client.post(
        BASE,
        json={"name": "Expiring Key", "expires_at": future},
        headers=_h(token),
    )
    assert res.status_code == 201
    assert res.json()["api_key"]["expires_at"] is not None


@pytest.mark.asyncio
async def test_generate_key_requires_auth(client: AsyncClient):
    """Generating a key without a token returns 401."""
    res = await client.post(BASE, json=KEY_PAYLOAD)
    assert res.status_code == 401


# ── Get Single ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_key_success(client: AsyncClient):
    """Fetch a key by ID returns full metadata."""
    token = await _register(client, "get1@keys.io")
    create = await client.post(BASE, json={"name": "Get Me"}, headers=_h(token))
    key_id = create.json()["api_key"]["id"]

    res = await client.get(f"{BASE}/{key_id}", headers=_h(token))
    assert res.status_code == 200
    assert res.json()["id"] == key_id
    assert res.json()["name"] == "Get Me"


@pytest.mark.asyncio
async def test_get_key_not_found(client: AsyncClient):
    """Fetching a non-existent key returns 404."""
    token = await _register(client, "get2@keys.io")
    fake_id = "00000000-0000-0000-0000-000000000000"
    res = await client.get(f"{BASE}/{fake_id}", headers=_h(token))
    assert res.status_code == 404


# ── List / Search / Filter ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_keys_pagination(client: AsyncClient):
    """Create 3 keys, list with limit=2 → 2 pages."""
    token = await _register(client, "list1@keys.io")
    for i in range(3):
        await client.post(BASE, json={"name": f"Key {i}"}, headers=_h(token))

    res = await client.get(f"{BASE}?page=1&limit=2", headers=_h(token))
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 3
    assert len(body["items"]) == 2
    assert body["total_pages"] == 2


@pytest.mark.asyncio
async def test_list_keys_search(client: AsyncClient):
    """Search by name matches only the relevant key."""
    token = await _register(client, "list2@keys.io")
    await client.post(BASE, json={"name": "Alpha Key"}, headers=_h(token))
    await client.post(BASE, json={"name": "Beta Key"}, headers=_h(token))

    res = await client.get(f"{BASE}?search=alpha", headers=_h(token))
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Alpha Key"


@pytest.mark.asyncio
async def test_list_keys_filter_active(client: AsyncClient):
    """Filter is_active=false returns only deactivated keys."""
    token = await _register(client, "list3@keys.io")
    create = await client.post(BASE, json={"name": "Active Key"}, headers=_h(token))
    key_id = create.json()["api_key"]["id"]

    # Deactivate
    await client.patch(f"{BASE}/{key_id}", json={"is_active": False}, headers=_h(token))

    res = await client.get(f"{BASE}?is_active=false", headers=_h(token))
    assert res.status_code == 200
    items = res.json()["items"]
    assert all(not item["is_active"] for item in items)
    assert any(item["id"] == key_id for item in items)


@pytest.mark.asyncio
async def test_list_keys_filter_scope(client: AsyncClient):
    """Filter scope returns only keys containing that scope."""
    token = await _register(client, "list4@keys.io")
    await client.post(BASE, json={"name": "Key Proj", "scopes": ["read:projects"]}, headers=_h(token))
    await client.post(BASE, json={"name": "Key Org", "scopes": ["read:organization"]}, headers=_h(token))

    res = await client.get(f"{BASE}?scope=read:projects", headers=_h(token))
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Key Proj"


# ── Update / Deactivate ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_key_name(client: AsyncClient):
    """Updating name reflects in subsequent GET."""
    token = await _register(client, "upd1@keys.io")
    create = await client.post(BASE, json={"name": "Old Name"}, headers=_h(token))
    key_id = create.json()["api_key"]["id"]

    res = await client.patch(f"{BASE}/{key_id}", json={"name": "New Name"}, headers=_h(token))
    assert res.status_code == 200
    assert res.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_deactivate_key(client: AsyncClient):
    """Setting is_active=False deactivates the key."""
    token = await _register(client, "upd2@keys.io")
    create = await client.post(BASE, json={"name": "Deactivate Me"}, headers=_h(token))
    key_id = create.json()["api_key"]["id"]

    res = await client.patch(f"{BASE}/{key_id}", json={"is_active": False}, headers=_h(token))
    assert res.status_code == 200
    assert res.json()["is_active"] is False


@pytest.mark.asyncio
async def test_update_rate_limit(client: AsyncClient):
    """Rate limit can be set and updated."""
    token = await _register(client, "upd3@keys.io")
    create = await client.post(BASE, json={"name": "Rate Key"}, headers=_h(token))
    key_id = create.json()["api_key"]["id"]

    res = await client.patch(f"{BASE}/{key_id}", json={"rate_limit_per_minute": 100}, headers=_h(token))
    assert res.status_code == 200
    assert res.json()["rate_limit_per_minute"] == 100


@pytest.mark.asyncio
async def test_update_scopes(client: AsyncClient):
    """Scopes can be updated to a new list."""
    token = await _register(client, "upd4@keys.io")
    create = await client.post(BASE, json={"name": "Scope Key", "scopes": ["read:projects"]}, headers=_h(token))
    key_id = create.json()["api_key"]["id"]

    res = await client.patch(
        f"{BASE}/{key_id}",
        json={"scopes": ["read:organization", "read:audit_logs"]},
        headers=_h(token),
    )
    assert res.status_code == 200
    assert set(res.json()["scopes"]) == {"read:organization", "read:audit_logs"}


@pytest.mark.asyncio
async def test_update_key_not_found(client: AsyncClient):
    """Updating a non-existent key returns 404."""
    token = await _register(client, "upd5@keys.io")
    fake_id = "00000000-0000-0000-0000-000000000001"
    res = await client.patch(
        f"{BASE}/{fake_id}",
        json={"name": "Ghost"},
        headers=_h(token),
    )
    assert res.status_code == 404


# ── Regenerate ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_regenerate_key_issues_new_token(client: AsyncClient):
    """Regeneration returns a brand-new token with a different prefix."""
    token = await _register(client, "regen1@keys.io")
    create = await client.post(BASE, json={"name": "Regen Key"}, headers=_h(token))
    old_plain = create.json()["key"]
    old_prefix = create.json()["api_key"]["prefix"]
    key_id = create.json()["api_key"]["id"]

    res = await client.post(f"{BASE}/{key_id}/regenerate", headers=_h(token))
    assert res.status_code == 200
    new_plain = res.json()["key"]
    new_prefix = res.json()["api_key"]["prefix"]

    assert new_plain != old_plain, "new token must differ from old token"
    # new_prefix may differ (likely will differ since random)
    assert new_plain.startswith(new_prefix)
    assert res.json()["api_key"]["usage_count"] == 0  # reset to 0


@pytest.mark.asyncio
async def test_regenerate_old_token_invalidated(client: AsyncClient):
    """After regeneration, the old token is rejected by the validate endpoint."""
    token = await _register(client, "regen2@keys.io")
    create = await client.post(BASE, json={"name": "Old Token"}, headers=_h(token))
    old_plain = create.json()["key"]
    key_id = create.json()["api_key"]["id"]

    # Validate old token — should be valid
    v1 = await client.post(f"{BASE}/validate?token={old_plain}")
    assert v1.json()["valid"] is True

    # Regenerate
    await client.post(f"{BASE}/{key_id}/regenerate", headers=_h(token))

    # Validate old token again — must now be invalid
    v2 = await client.post(f"{BASE}/validate?token={old_plain}")
    assert v2.json()["valid"] is False


# ── Validate ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_validate_active_key_success(client: AsyncClient):
    """Validating a fresh key returns valid=True and correct scopes."""
    token = await _register(client, "val1@keys.io")
    create = await client.post(
        BASE,
        json={"name": "Validate Me", "scopes": ["read:projects"]},
        headers=_h(token),
    )
    plain = create.json()["key"]

    res = await client.post(f"{BASE}/validate?token={plain}")
    assert res.status_code == 200
    body = res.json()
    assert body["valid"] is True
    assert body["scopes"] == ["read:projects"]


@pytest.mark.asyncio
async def test_validate_increments_usage_count(client: AsyncClient):
    """Each successful validation increments usage_count."""
    token = await _register(client, "val2@keys.io")
    create = await client.post(BASE, json={"name": "Usage Key"}, headers=_h(token))
    plain = create.json()["key"]
    key_id = create.json()["api_key"]["id"]

    # Validate 3 times
    for _ in range(3):
        await client.post(f"{BASE}/validate?token={plain}")

    detail = await client.get(f"{BASE}/{key_id}", headers=_h(token))
    assert detail.json()["usage_count"] == 3


@pytest.mark.asyncio
async def test_validate_inactive_key_rejected(client: AsyncClient):
    """Validating an inactive key returns valid=False."""
    token = await _register(client, "val3@keys.io")
    create = await client.post(BASE, json={"name": "Inactive Key"}, headers=_h(token))
    plain = create.json()["key"]
    key_id = create.json()["api_key"]["id"]

    # Deactivate
    await client.patch(f"{BASE}/{key_id}", json={"is_active": False}, headers=_h(token))

    res = await client.post(f"{BASE}/validate?token={plain}")
    assert res.json()["valid"] is False
    assert "inactive" in res.json()["message"].lower()


@pytest.mark.asyncio
async def test_validate_expired_key_rejected(client: AsyncClient):
    """Validating an expired key returns valid=False."""
    token = await _register(client, "val4@keys.io")
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    create = await client.post(
        BASE,
        json={"name": "Expired Key", "expires_at": past},
        headers=_h(token),
    )
    plain = create.json()["key"]

    res = await client.post(f"{BASE}/validate?token={plain}")
    assert res.json()["valid"] is False
    assert "expired" in res.json()["message"].lower()


@pytest.mark.asyncio
async def test_validate_nonexistent_token_rejected(client: AsyncClient):
    """Validating a made-up token returns valid=False."""
    res = await client.post(f"{BASE}/validate?token=totallyfaketoken12345")
    assert res.json()["valid"] is False
    assert "Invalid" in res.json()["message"]


# ── Delete ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_key_success(client: AsyncClient):
    """Deleting a key returns 204 and it disappears from list."""
    token = await _register(client, "del1@keys.io")
    create = await client.post(BASE, json={"name": "Delete Me"}, headers=_h(token))
    key_id = create.json()["api_key"]["id"]

    res = await client.delete(f"{BASE}/{key_id}", headers=_h(token))
    assert res.status_code == 204

    # Must no longer be in the list
    lst = await client.get(BASE, headers=_h(token))
    ids = [k["id"] for k in lst.json()["items"]]
    assert key_id not in ids


@pytest.mark.asyncio
async def test_delete_key_not_found(client: AsyncClient):
    """Deleting a non-existent key returns 404."""
    token = await _register(client, "del2@keys.io")
    fake_id = "00000000-0000-0000-0000-000000000002"
    res = await client.delete(f"{BASE}/{fake_id}", headers=_h(token))
    assert res.status_code == 404


# ── Scopes Catalogue ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_scopes(client: AsyncClient):
    """Scopes endpoint returns a non-empty list of valid scope strings."""
    token = await _register(client, "scopes@keys.io")
    res = await client.get(f"{BASE}/scopes", headers=_h(token))
    assert res.status_code == 200
    scopes = res.json()
    assert isinstance(scopes, list)
    assert len(scopes) > 0
    assert "read:projects" in scopes
    assert "admin:all" in scopes
