// ────────────────────────────────────────────────────────────────────────────
// Project Management – TypeScript Type Definitions
// Each Project represents one client website.
// ────────────────────────────────────────────────────────────────────────────

export type ProjectStatus = "active" | "onboarding" | "maintenance" | "archived";

export interface Project {
  id: string;
  organization_id: string;
  creator_id?: string | null;
  name: string;
  slug: string;
  website_url?: string | null;
  country?: string | null;
  timezone?: string | null;
  industry?: string | null;
  currency: string;
  status: ProjectStatus;
  logo_url?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectAuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface ProjectDetail extends Project {
  audit_logs: ProjectAuditLog[];
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ProjectCreateRequest {
  name: string;
  website_url?: string;
  country?: string;
  timezone?: string;
  industry?: string;
  currency?: string;
  status?: ProjectStatus;
  logo_url?: string;
  description?: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  website_url?: string;
  country?: string;
  timezone?: string;
  industry?: string;
  currency?: string;
  status?: ProjectStatus;
  logo_url?: string;
  description?: string;
}

export interface ProjectListParams {
  search?: string;
  status?: string;
  industry?: string;
  country?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// ── Static Options ────────────────────────────────────────────────────────────

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: "active", label: "Active", color: "emerald" },
  { value: "onboarding", label: "Onboarding", color: "blue" },
  { value: "maintenance", label: "Maintenance", color: "amber" },
  { value: "archived", label: "Archived", color: "slate" },
];

export const PROJECT_INDUSTRIES = [
  "SaaS",
  "E-commerce",
  "Healthcare",
  "Finance",
  "Education",
  "Real Estate",
  "Logistics",
  "Media",
  "Gaming",
  "Retail",
  "Manufacturing",
  "Other",
];

export const PROJECT_CURRENCIES = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "PKR", label: "Pakistani Rupee (₨)" },
  { code: "AED", label: "UAE Dirham (د.إ)" },
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
];

export const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];
