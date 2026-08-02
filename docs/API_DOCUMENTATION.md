# SalesAI REST API Documentation Specification

The SalesAI platform provides a production-grade, RESTful API built on **FastAPI**. All API endpoints are versioned under `/api/v1` and feature OpenAPI 3.0 / Swagger documentation.

---

## 🌐 OpenAPI Interactive Documentation

When running locally or via Docker Compose, interactive API documentation is accessible at:
* **Swagger UI**: `http://localhost:8000/api/v1/docs`
* **ReDoc UI**: `http://localhost:8000/api/v1/redoc`
* **OpenAPI JSON Spec**: `http://localhost:8000/api/v1/openapi.json`

---

## 🔑 Authentication

All protected endpoints require a Bearer JWT access token passed in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_access_token>
```

---

## 📑 API Endpoint Catalogue

### 1. Health & System Telemetry
* `GET /api/v1/health` — Live check of backend service, PostgreSQL database, and Redis cache health.

### 2. Authentication & Account Management (`/api/v1/auth`)
* `POST /api/v1/auth/register` — Register new user account & provision workspace organization.
* `POST /api/v1/auth/login` — Authenticate email/password credentials and issue access/refresh token pair.
* `POST /api/v1/auth/refresh` — Rotate refresh token for new access token.
* `POST /api/v1/auth/logout` — Revoke active user session.
* `POST /api/v1/auth/forgot-password` — Dispatch password reset token.
* `POST /api/v1/auth/reset-password` — Verify reset token and update account password.
* `GET /api/v1/auth/me` — Retrieve current authenticated user profile.
* `PATCH /api/v1/auth/me` — Update user profile details.
* `POST /api/v1/auth/change-password` — Change password after verifying old password.
* `DELETE /api/v1/auth/account` — Soft delete user account.

### 3. Client Website Projects (`/api/v1/projects`)
* `POST /api/v1/projects` — Create client website project within current organization.
* `GET /api/v1/projects` — List, search, filter (status, industry, country), and paginate projects.
* `GET /api/v1/projects/{project_id}` — Get project details and activity audit history.
* `PATCH /api/v1/projects/{project_id}` — Update client website attributes (URL, country, timezone, industry, logo).
* `DELETE /api/v1/projects/{project_id}` — Soft delete client website project.

### 4. Organization & Team Management (`/api/v1/organizations`)
* `POST /api/v1/organizations` — Provision new organization workspace.
* `GET /api/v1/organizations/me` — Retrieve organization details and team member counts.
* `PATCH /api/v1/organizations/me` — Update organization name or custom domain.
* `GET /api/v1/organizations/me/members` — List organization team members.
* `POST /api/v1/organizations/me/invitations` — Invite team member with specified workspace role.
* `POST /api/v1/organizations/invitations/accept` — Accept invitation token and join workspace.
* `DELETE /api/v1/organizations/me/members/{user_id}` — Remove team member from workspace.
* `PATCH /api/v1/organizations/me/members/{user_id}/role` — Change member workspace role.
* `POST /api/v1/organizations/me/transfer-ownership` — Transfer Owner status to another member.

### 5. API Keys System (`/api/v1/api-keys`)
* `GET /api/v1/api-keys` — Search, filter, and paginate organization API keys.
* `POST /api/v1/api-keys` — Generate new API key (plain token returned once).
* `GET /api/v1/api-keys/scopes` — Fetch available permission scopes catalogue.
* `GET /api/v1/api-keys/{key_id}` — Get single API key metadata.
* `POST /api/v1/api-keys/{key_id}/regenerate` — Invalidate current token hash and issue a new API key.
* `PATCH /api/v1/api-keys/{key_id}` — Update name, scopes, expiration date, active status, or rate limit.
* `DELETE /api/v1/api-keys/{key_id}` — Delete API key.
* `POST /api/v1/api-keys/validate` — Validate plain-text API key for external service integrations.

### 6. Settings & Preferences (`/api/v1/settings`)
* `GET /api/v1/settings/user` — Fetch user language, timezone, theme, and notification preferences.
* `PATCH /api/v1/settings/user` — Update user preferences.
* `GET /api/v1/settings/sessions` — List active login sessions.
* `DELETE /api/v1/settings/sessions/{session_id}` — Revoke specific login session.
* `DELETE /api/v1/settings/sessions` — Revoke all other active sessions.
* `GET /api/v1/settings/2fa` — Fetch 2FA status, QR code preview, and backup codes.
* `POST /api/v1/settings/2fa/enable` — Enable 2FA authentication.
* `POST /api/v1/settings/2fa/disable` — Disable 2FA authentication.
* `GET /api/v1/settings/organization` — Fetch workspace system settings.
* `PATCH /api/v1/settings/organization` — Update workspace system settings.

### 7. Audit Logging (`/api/v1/audit-logs`)
* `GET /api/v1/audit-logs` — List, search, filter by resource type/action, and paginate audit events.
* `GET /api/v1/audit-logs/export` — Download audit events as a CSV spreadsheet file.
* `GET /api/v1/audit-logs/{log_id}` — Get single audit log event detail.
