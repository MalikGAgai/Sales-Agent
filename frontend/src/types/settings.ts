export interface UserSettings {
  user_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  language: string;
  timezone: string;
  theme: "dark" | "light" | "system";
  accent_color: "blue" | "indigo" | "purple" | "emerald" | "amber";
  email_notifications: boolean;
  security_alerts: boolean;
  product_updates: boolean;
  digest_frequency: "instant" | "daily" | "weekly" | "never";
  session_timeout_minutes: number;
  two_factor_enabled: boolean;
}

export interface UserSettingsUpdateRequest {
  first_name?: string;
  last_name?: string;
  language?: string;
  timezone?: string;
  theme?: "dark" | "light" | "system";
  accent_color?: "blue" | "indigo" | "purple" | "emerald" | "amber";
  email_notifications?: boolean;
  security_alerts?: boolean;
  product_updates?: boolean;
  digest_frequency?: "instant" | "daily" | "weekly" | "never";
  session_timeout_minutes?: number;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at: string;
  is_revoked: boolean;
  is_current: boolean;
  created_at: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  qr_code_url?: string | null;
  secret_key?: string | null;
  backup_codes: string[];
  message: string;
}

export interface OrganizationSettings {
  organization_id: string;
  site_name: string;
  support_email: string;
  default_language: string;
  default_timezone: string;
  allowed_ip_ranges?: string | null;
  enforce_2fa: boolean;
  require_password_change_days?: number | null;
  updated_at: string;
}
