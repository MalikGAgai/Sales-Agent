import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient):
    payload = {
        "email": "testuser@salesai.io",
        "password": "Password123!",
        "first_name": "Test",
        "last_name": "User",
        "organization_name": "Acme Corp",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email_fails(client: AsyncClient):
    payload = {
        "email": "duplicate@salesai.io",
        "password": "Password123!",
        "first_name": "User1",
    }
    response1 = await client.post("/api/v1/auth/register", json=payload)
    assert response1.status_code == 201

    response2 = await client.post("/api/v1/auth/register", json=payload)
    assert response2.status_code == 409
    assert "already exists" in response2.json()["message"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Register first
    reg_payload = {
        "email": "loginuser@salesai.io",
        "password": "SecurePassword123!",
        "first_name": "Login",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    # Login
    login_payload = {
        "email": "loginuser@salesai.io",
        "password": "SecurePassword123!",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_invalid_password_fails(client: AsyncClient):
    reg_payload = {
        "email": "wrongpwd@salesai.io",
        "password": "CorrectPassword123!",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": "wrongpwd@salesai.io",
        "password": "WrongPassword123!",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_profile_success(client: AsyncClient):
    reg_payload = {
        "email": "me@salesai.io",
        "password": "Password123!",
        "first_name": "Jane",
        "last_name": "Doe",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == "me@salesai.io"
    assert profile["first_name"] == "Jane"
    assert profile["last_name"] == "Doe"


@pytest.mark.asyncio
async def test_change_password_success(client: AsyncClient):
    reg_payload = {
        "email": "changepwd@salesai.io",
        "password": "OldPassword123!",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_res.json()["access_token"]

    change_payload = {
        "old_password": "OldPassword123!",
        "new_password": "NewPassword456!",
    }
    headers = {"Authorization": f"Bearer {token}"}
    res = await client.post("/api/v1/auth/change-password", json=change_payload, headers=headers)
    assert res.status_code == 200

    # Verify old password fails login
    fail_login = await client.post("/api/v1/auth/login", json={"email": "changepwd@salesai.io", "password": "OldPassword123!"})
    assert fail_login.status_code == 401

    # Verify new password succeeds login
    succ_login = await client.post("/api/v1/auth/login", json={"email": "changepwd@salesai.io", "password": "NewPassword456!"})
    assert succ_login.status_code == 200


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient):
    reg_payload = {
        "email": "refresh@salesai.io",
        "password": "Password123!",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    refresh_token = reg_res.json()["refresh_token"]

    ref_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_res.status_code == 200
    new_tokens = ref_res.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
