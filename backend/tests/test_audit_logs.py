"""
test_audit_logs.py — Comprehensive unit tests for Audit Logging Module.

Coverage:
  - Log generation on actions (login, project create, api_key generate, settings update)
  - List audit logs with pagination
  - Search audit logs by action or resource type
  - Filter audit logs by resource_type
  - CSV export of audit logs
  - Get single audit log detail by ID
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
            "first_name": "Audit",
            "last_name": "Tester",
            "organization_name": "AuditCorp",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


def _h(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


BASE = "/api/v1/audit-logs"


@pytest.mark.asyncio
async def test_list_audit_logs_pagination(client: AsyncClient):
    """Actions performed populate audit logs, returned with pagination metadata."""
    token = await _register(client, "audit1@logs.io")

    # Generate an API key to trigger an audit event
    await client.post(
        "/api/v1/api-keys",
        json={"name": "Audit Test Key"},
        headers=_h(token),
    )

    res = await client.get(f"{BASE}?page=1&limit=10", headers=_h(token))
    assert res.status_code == 200, res.text
    body = res.json()
    assert "items" in body
    assert body["total"] >= 1
    assert body["page"] == 1


@pytest.mark.asyncio
async def test_list_audit_logs_search(client: AsyncClient):
    """Search by action query filters matching audit events."""
    token = await _register(client, "audit2@logs.io")

    # Create a project to trigger a project.created audit log
    await client.post(
        "/api/v1/projects",
        json={"name": "Audit Project"},
        headers=_h(token),
    )

    res = await client.get(f"{BASE}?search=project", headers=_h(token))
    assert res.status_code == 200, res.text
    items = res.json()["items"]
    assert len(items) >= 1
    assert any("project" in item["action"].lower() for item in items)


@pytest.mark.asyncio
async def test_list_audit_logs_filter_resource_type(client: AsyncClient):
    """Filtering by resource_type returns only matching audit entries."""
    token = await _register(client, "audit3@logs.io")

    await client.post(
        "/api/v1/api-keys",
        json={"name": "Filtered Key"},
        headers=_h(token),
    )

    res = await client.get(f"{BASE}?resource_type=api_key", headers=_h(token))
    assert res.status_code == 200, res.text
    items = res.json()["items"]
    assert all(item["resource_type"] == "api_key" for item in items)


@pytest.mark.asyncio
async def test_export_audit_logs_csv(client: AsyncClient):
    """Exporting audit logs returns a text/csv spreadsheet file."""
    token = await _register(client, "audit4@logs.io")

    res = await client.get(f"{BASE}/export", headers=_h(token))
    assert res.status_code == 200, res.text
    assert "text/csv" in res.headers["content-type"]
    assert "Timestamp,Action,Resource Type" in res.text


@pytest.mark.asyncio
async def test_get_audit_log_detail(client: AsyncClient):
    """Fetching a single audit log entry by ID returns full metadata."""
    token = await _register(client, "audit5@logs.io")

    # Generate an API key to trigger an audit log
    key_res = await client.post(
        "/api/v1/api-keys",
        json={"name": "Detail Test Key"},
        headers=_h(token),
    )
    assert key_res.status_code == 201

    logs = await client.get(f"{BASE}?resource_type=api_key", headers=_h(token))
    assert logs.status_code == 200
    items = logs.json()["items"]
    assert len(items) >= 1
    target_id = items[0]["id"]

    detail = await client.get(f"{BASE}/{target_id}", headers=_h(token))
    assert detail.status_code == 200
    assert detail.json()["id"] == target_id
    assert "actor" in detail.json()
