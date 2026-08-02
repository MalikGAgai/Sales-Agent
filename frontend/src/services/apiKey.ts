import {
  ApiKey,
  ApiKeyCreateRequest,
  ApiKeyGenerateResponse,
  ApiKeyListParams,
  ApiKeyListResponse,
  ApiKeyUpdateRequest,
  ApiKeyValidateResponse,
} from "@/types/apiKey";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ── Shared helpers ────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

/** Copy text to clipboard — returns true on success */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

// ── API Key Service ───────────────────────────────────────────────────────────

export const apiKeyService = {
  /** Generate a new API key. Returns plain token once — store it. */
  async createApiKey(data: ApiKeyCreateRequest): Promise<ApiKeyGenerateResponse> {
    const res = await fetch(`${API_BASE}/api-keys`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiKeyGenerateResponse>(res);
  },

  /** List API keys with optional search, filters, sort, and pagination */
  async listApiKeys(params: ApiKeyListParams = {}): Promise<ApiKeyListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.is_active !== undefined) query.set("is_active", String(params.is_active));
    if (params.scope) query.set("scope", params.scope);
    if (params.expires_before) query.set("expires_before", params.expires_before);
    if (params.expires_after) query.set("expires_after", params.expires_after);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const res = await fetch(`${API_BASE}/api-keys?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiKeyListResponse>(res);
  },

  /** Get single API key detail (no plain token) */
  async getApiKey(id: string): Promise<ApiKey> {
    const res = await fetch(`${API_BASE}/api-keys/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiKey>(res);
  },

  /** Regenerate key — old token invalidated, new plain token returned once */
  async regenerateApiKey(id: string): Promise<ApiKeyGenerateResponse> {
    const res = await fetch(`${API_BASE}/api-keys/${id}/regenerate`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<ApiKeyGenerateResponse>(res);
  },

  /** Partial update — name, scopes, expiry, is_active, rate_limit_per_minute */
  async updateApiKey(id: string, data: ApiKeyUpdateRequest): Promise<ApiKey> {
    const res = await fetch(`${API_BASE}/api-keys/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ApiKey>(res);
  },

  /** Permanently delete a key */
  async deleteApiKey(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api-keys/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },

  /** Validate a plain-text token — no auth required */
  async validateApiKey(token: string): Promise<ApiKeyValidateResponse> {
    const res = await fetch(
      `${API_BASE}/api-keys/validate?token=${encodeURIComponent(token)}`,
      { method: "POST" }
    );
    return handleResponse<ApiKeyValidateResponse>(res);
  },

  /** Fetch the predefined scopes catalogue */
  async listScopes(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/api-keys/scopes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<string[]>(res);
  },
};
