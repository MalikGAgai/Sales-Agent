import {
  ActiveSession,
  OrganizationSettings,
  TwoFactorStatus,
  UserSettings,
  UserSettingsUpdateRequest,
} from "@/types/settings";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const settingsService = {
  async getUserSettings(): Promise<UserSettings> {
    const res = await fetch(`${BASE_URL}/settings/user`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to load user settings.");
    return res.json();
  },

  async updateUserSettings(data: UserSettingsUpdateRequest): Promise<UserSettings> {
    const res = await fetch(`${BASE_URL}/settings/user`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update settings.");
    }
    return res.json();
  },

  async listSessions(): Promise<ActiveSession[]> {
    const res = await fetch(`${BASE_URL}/settings/sessions`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to load active sessions.");
    return res.json();
  },

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/settings/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to revoke session.");
    return res.json();
  },

  async revokeAllOtherSessions(): Promise<{ message: string; revoked_count: number }> {
    const res = await fetch(`${BASE_URL}/settings/sessions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to revoke other sessions.");
    return res.json();
  },

  async get2FAStatus(): Promise<TwoFactorStatus> {
    const res = await fetch(`${BASE_URL}/settings/2fa`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to load 2FA status.");
    return res.json();
  },

  async enable2FA(code: string): Promise<TwoFactorStatus> {
    const res = await fetch(`${BASE_URL}/settings/2fa/enable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ totp_code: code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Invalid 2FA code.");
    }
    return res.json();
  },

  async disable2FA(password: string): Promise<TwoFactorStatus> {
    const res = await fetch(`${BASE_URL}/settings/2fa/disable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ current_password: password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Incorrect password.");
    }
    return res.json();
  },

  async getOrgSettings(): Promise<OrganizationSettings> {
    const res = await fetch(`${BASE_URL}/settings/organization`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to load organization settings.");
    return res.json();
  },

  async updateOrgSettings(data: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    const res = await fetch(`${BASE_URL}/settings/organization`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update organization settings.");
    }
    return res.json();
  },
};
