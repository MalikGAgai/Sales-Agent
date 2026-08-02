// ─────────────────────────────────────────────────────────────────────────────
// API Key Management – TypeScript Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  /** First 8 characters of the plain key — safe to display */
  prefix: string;
  scopes: string[];
  usage_count: number;
  last_used_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  rate_limit_per_minute?: number | null;
  created_at: string;
  updated_at: string;
}

/** Returned once after generation/regeneration — key is shown then hidden */
export interface ApiKeyGenerateResponse {
  key: string;
  api_key: ApiKey;
}

export interface ApiKeyListResponse {
  items: ApiKey[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiKeyCreateRequest {
  name: string;
  expires_at?: string | null;
  scopes?: string[];
  rate_limit_per_minute?: number | null;
}

export interface ApiKeyUpdateRequest {
  name?: string;
  expires_at?: string | null;
  scopes?: string[];
  is_active?: boolean;
  rate_limit_per_minute?: number | null;
}

export interface ApiKeyValidateResponse {
  valid: boolean;
  key_id?: string | null;
  scopes?: string[] | null;
  message: string;
}

export interface ApiKeyListParams {
  search?: string;
  is_active?: boolean;
  scope?: string;
  expires_before?: string;
  expires_after?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ── Static Options ────────────────────────────────────────────────────────────

export const AVAILABLE_SCOPES: { value: string; label: string; description: string }[] = [
  { value: "read:projects",      label: "Read Projects",      description: "View project list and details" },
  { value: "write:projects",     label: "Write Projects",     description: "Create and update projects" },
  { value: "read:api_keys",      label: "Read API Keys",      description: "View API key list and metadata" },
  { value: "write:api_keys",     label: "Write API Keys",     description: "Create, update, delete API keys" },
  { value: "read:organization",  label: "Read Organization",  description: "View organization settings and members" },
  { value: "write:organization", label: "Write Organization", description: "Manage organization settings" },
  { value: "read:audit_logs",    label: "Read Audit Logs",    description: "View all audit log entries" },
  { value: "admin:all",          label: "Admin — All",        description: "Full administrative access" },
];
