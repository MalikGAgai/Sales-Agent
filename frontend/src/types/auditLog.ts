export interface ActorInfo {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface AuditLog {
  id: string;
  organization_id?: string | null;
  actor_id?: string | null;
  actor?: ActorInfo | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  search?: string;
  resource_type?: string;
  action?: string;
  from_date?: string;
  to_date?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
