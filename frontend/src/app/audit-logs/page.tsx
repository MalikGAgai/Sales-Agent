"use client";

import { useCallback, useEffect, useState } from "react";
import { auditLogService } from "@/services/auditLog";
import { AuditLog, AuditLogListParams } from "@/types/auditLog";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Selected Log Drawer / Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const LIMIT = 15;

  const fetchLogs = useCallback(async (pg = page) => {
    setLoading(true);
    setError("");
    try {
      const params: AuditLogListParams = {
        page: pg,
        limit: LIMIT,
      };
      if (search.trim()) params.search = search.trim();
      if (resourceType) params.resource_type = resourceType;
      if (fromDate) params.from_date = new Date(fromDate).toISOString();
      if (toDate) params.to_date = new Date(toDate).toISOString();

      const res = await auditLogService.listLogs(params);
      setLogs(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [page, search, resourceType, fromDate, toDate]);

  useEffect(() => {
    fetchLogs(page);
  }, [page, resourceType, fromDate, toDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  const handleExportCSV = async () => {
    try {
      await auditLogService.downloadCSVExport(resourceType || undefined);
    } catch (e: unknown) {
      alert("Failed to export CSV file.");
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit_logs_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadge = (action: string) => {
    if (action.includes("login") || action.includes("security")) {
      return "bg-amber-500/10 text-amber-400 ring-amber-500/30";
    }
    if (action.includes("created")) {
      return "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30";
    }
    if (action.includes("deleted") || action.includes("revoked")) {
      return "bg-rose-500/10 text-rose-400 ring-rose-500/30";
    }
    if (action.includes("updated") || action.includes("regenerated")) {
      return "bg-blue-500/10 text-blue-400 ring-blue-500/30";
    }
    return "bg-purple-500/10 text-purple-400 ring-purple-500/30";
  };

  return (
    <div className="space-y-6 min-h-screen pb-16">
      {/* ── Top Header & Actions ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-600/30">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-3.123-.186A48.406 48.406 0 0012 3.75c-2.454 0-4.87.164-7.228.48A2.25 2.25 0 002.75 6.425v11.825c0 1.243 1.007 2.25 2.25 2.25h12.502" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Activity & Security Audit Logs</h1>
              <p className="text-xs text-slate-400">
                Immutable audit telemetry tracking logins, API keys, role changes, and system settings.
              </p>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 shadow-md hover:bg-slate-800 hover:text-white transition"
          >
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 shadow-md hover:bg-slate-800 hover:text-white transition"
          >
            <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
            Export JSON
          </button>
        </div>
      </div>

      {/* ── Stats Cards Summary ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Logged Events", value: total, color: "text-purple-400" },
          { label: "Security Actions", value: logs.filter((l) => l.action.includes("login") || l.action.includes("2fa")).length, color: "text-amber-400" },
          { label: "API Key Rotations", value: logs.filter((l) => l.resource_type === "api_key").length, color: "text-emerald-400" },
          { label: "Project Mutations", value: logs.filter((l) => l.resource_type === "project").length, color: "text-blue-400" },
        ].map((st) => (
          <div key={st.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 ring-1 ring-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{st.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${st.color}`}>{st.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Controls Bar ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, resource, or IP address..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          {/* Resource Type Dropdown */}
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="">All Resource Types</option>
            <option value="user">User & Auth</option>
            <option value="project">Projects</option>
            <option value="api_key">API Keys</option>
            <option value="role">Roles & Team</option>
            <option value="settings">Settings</option>
            <option value="organization">Organization</option>
          </select>

          {/* Date Range Inputs */}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 outline-none [color-scheme:dark]"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 outline-none [color-scheme:dark]"
          />

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            Filter
          </button>
        </form>
      </div>

      {/* ── Audit Logs Table ──────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        {error && (
          <div className="bg-rose-500/10 p-4 text-xs text-rose-400 border-b border-rose-500/20">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/80 font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor / User</th>
                <th className="px-4 py-3">Action Event</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Browser / Device</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 rounded bg-slate-800/60" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    No audit log events match your filter query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white">
                        {log.actor ? `${log.actor.first_name || ""} ${log.actor.last_name || ""}`.trim() || log.actor.email : "System / Gateway"}
                      </div>
                      <div className="text-[10px] text-slate-500">{log.actor?.email || "internal-process"}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ring-1 ring-inset ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                        {log.resource_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate">
                      {log.user_agent || "System API"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:bg-slate-700"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs">
            <span className="text-slate-400">
              Page {page} of {totalPages} · {total} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── JSON Inspect Modal ────────────────────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Audit Event Details</h3>
                <p className="text-xs text-slate-400">Event ID: {selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 font-semibold block">Action</span>
                  <span className="font-mono text-blue-400 font-bold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Resource Type</span>
                  <span className="font-mono text-purple-400 font-bold">{selectedLog.resource_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">IP Address</span>
                  <span className="font-mono text-slate-200">{selectedLog.ip_address || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Actor Email</span>
                  <span className="text-slate-200">{selectedLog.actor?.email || "System"}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Details JSON Payload</span>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
