import { AuditLog, AuditLogListParams, AuditLogListResponse } from "@/types/auditLog";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const auditLogService = {
  async listLogs(params: AuditLogListParams = {}): Promise<AuditLogListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.search) query.set("search", params.search);
    if (params.resource_type) query.set("resource_type", params.resource_type);
    if (params.action) query.set("action", params.action);
    if (params.from_date) query.set("from_date", params.from_date);
    if (params.to_date) query.set("to_date", params.to_date);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);

    const res = await fetch(`${BASE_URL}/audit-logs?${query.toString()}`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to load audit logs.");
    return res.json();
  },

  async downloadCSVExport(resourceType?: string, action?: string): Promise<void> {
    const query = new URLSearchParams();
    if (resourceType) query.set("resource_type", resourceType);
    if (action) query.set("action", action);

    const res = await fetch(`${BASE_URL}/audit-logs/export?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to export CSV.");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async getLogDetail(id: string): Promise<AuditLog> {
    const res = await fetch(`${BASE_URL}/audit-logs/${id}`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to load audit log details.");
    return res.json();
  },
};
