import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_organization_crud_and_members(client: AsyncClient):
    # 1. Register Owner
    reg_payload = {
        "email": "owner@acme.com",
        "password": "OwnerPassword123!",
        "first_name": "Alice",
        "last_name": "Owner",
        "organization_name": "Acme Inc",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    owner_token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {owner_token}"}

    # 2. Get current organization
    org_res = await client.get("/api/v1/organizations/me", headers=headers)
    assert org_res.status_code == 200
    org_data = org_res.json()
    assert org_data["name"] == "Acme Inc"
    assert org_data["member_count"] == 1

    # 3. Update organization settings
    update_res = await client.patch(
        "/api/v1/organizations/me",
        json={"name": "Acme Enterprise", "domain": "acme.com"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Acme Enterprise"
    assert update_res.json()["domain"] == "acme.com"

    # 4. List members
    members_res = await client.get("/api/v1/organizations/me/members", headers=headers)
    assert members_res.status_code == 200
    members = members_res.json()
    assert len(members) == 1
    assert members[0]["email"] == "owner@acme.com"

    # 5. List available roles
    roles_res = await client.get("/api/v1/organizations/me/roles", headers=headers)
    assert roles_res.status_code == 200
    roles = roles_res.json()
    role_codes = {r["code"] for r in roles}
    assert {"owner", "admin", "manager", "developer", "viewer"}.issubset(role_codes)


@pytest.mark.asyncio
async def test_invite_and_accept_workflow(client: AsyncClient):
    # Register Owner
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "inviter@corp.com",
            "password": "Password123!",
            "organization_name": "Corp Inc",
        },
    )
    owner_token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {owner_token}"}

    # Invite Developer
    invite_res = await client.post(
        "/api/v1/organizations/me/invitations",
        json={"email": "dev@corp.com", "role_code": "developer"},
        headers=headers,
    )
    assert invite_res.status_code == 201
    invite_data = invite_res.json()
    assert invite_data["email"] == "dev@corp.com"
    assert invite_data["role_code"] == "developer"
    assert "token=" in invite_data["invite_url"]

    # Extract token
    raw_token = invite_data["invite_url"].split("token=")[1]

    # Accept invitation
    accept_res = await client.post(
        "/api/v1/organizations/invitations/accept",
        json={
            "token": raw_token,
            "first_name": "Bob",
            "last_name": "Developer",
            "password": "DevPassword123!",
        },
    )
    assert accept_res.status_code == 200
    new_member = accept_res.json()
    assert new_member["email"] == "dev@corp.com"

    # Verify team members list
    members_res = await client.get("/api/v1/organizations/me/members", headers=headers)
    assert len(members_res.json()) == 2
