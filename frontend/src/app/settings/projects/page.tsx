"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { projectService } from "@/services/project";
import {
  Project,
  ProjectCreateRequest,
  ProjectListParams,
  PROJECT_CURRENCIES,
  PROJECT_INDUSTRIES,
  PROJECT_STATUSES,
  TIMEZONES,
} from "@/types/project";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusMeta(status: string) {
  return (
    PROJECT_STATUSES.find((s) => s.value === status) ?? {
      label: status,
      color: "slate",
    }
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  onboarding: "bg-blue-500/15 text-blue-400 ring-blue-500/25",
  maintenance: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
  archived: "bg-slate-500/15 text-slate-400 ring-slate-500/25",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  const cls = STATUS_STYLES[status] ?? "bg-slate-500/15 text-slate-400 ring-slate-500/25";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}

function SortIcon({ field, current, order }: { field: string; current: string; order: string }) {
  if (current !== field) return <span className="ml-1 opacity-30">↕</span>;
  return <span className="ml-1">{order === "asc" ? "↑" : "↓"}</span>;
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────

interface ProjectFormModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function CreateProjectModal({ onClose, onSaved }: ProjectFormModalProps) {
  const [form, setForm] = useState<ProjectCreateRequest>({
    name: "",
    website_url: "",
    country: "",
    timezone: "UTC",
    industry: "",
    currency: "USD",
    status: "active",
    logo_url: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await projectService.createProject(form);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">New Client Website</h2>
            <p className="text-xs text-slate-400 mt-0.5">Each project represents one client site.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={255}
              placeholder="Acme Technologies Website"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Website URL
            </label>
            <input
              name="website_url"
              value={form.website_url ?? ""}
              onChange={handleChange}
              type="url"
              placeholder="https://acme.com"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
            />
          </div>

          {/* Row: Country + Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Country
              </label>
              <input
                name="country"
                value={form.country ?? ""}
                onChange={handleChange}
                placeholder="US, GB, PK..."
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Timezone
              </label>
              <select
                name="timezone"
                value={form.timezone ?? "UTC"}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1a2332] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Industry + Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Industry
              </label>
              <select
                name="industry"
                value={form.industry ?? ""}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1a2332] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              >
                <option value="">Select industry…</option>
                {PROJECT_INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1a2332] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              >
                {PROJECT_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Status + Logo URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1a2332] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Logo URL
              </label>
              <input
                name="logo_url"
                value={form.logo_url ?? ""}
                onChange={handleChange}
                placeholder="https://acme.com/logo.png"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={form.description ?? ""}
              onChange={handleChange}
              rows={3}
              placeholder="Short description of the client website…"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  project,
  onClose,
  onDeleted,
}: {
  project: Project;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectService.deleteProject(project.id);
      onDeleted();
      onClose();
    } catch {
      alert("Failed to delete project.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Delete Project?</h3>
        <p className="text-sm text-slate-400">
          This will soft-delete{" "}
          <span className="text-white font-semibold">{project.name}</span>. The project
          will be removed from the active list but retained in audit logs.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter();

  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter / Sort / Search State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch projects ──────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async (params: ProjectListParams) => {
    setLoading(true);
    setError("");
    try {
      const res = await projectService.listProjects({ ...params, limit });
      setProjects(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects({ search, status: statusFilter, industry: industryFilter, country: countryFilter, sort_by: sortBy, sort_order: sortOrder, page });
  }, [statusFilter, industryFilter, sortBy, sortOrder, page, fetchProjects]);

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchProjects({ search: val, status: statusFilter, industry: industryFilter, country: countryFilter, sort_by: sortBy, sort_order: sortOrder, page: 1 });
    }, 400);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleFilterChange = (key: "status" | "industry", val: string) => {
    if (key === "status") setStatusFilter(val);
    else setIndustryFilter(val);
    setPage(1);
  };

  const refreshList = () =>
    fetchProjects({ search, status: statusFilter, industry: industryFilter, country: countryFilter, sort_by: sortBy, sort_order: sortOrder, page });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Projects
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage client websites — {total} project{total !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span className="text-lg leading-none">+</span> New Project
          </button>
        </div>

        {/* ── Toolbar: Search + Filters ── */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name, URL, or description…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#1a2332] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[140px]"
          >
            <option value="all">All Statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Industry Filter */}
          <select
            value={industryFilter}
            onChange={(e) => handleFilterChange("industry", e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#1a2332] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[150px]"
          >
            <option value="all">All Industries</option>
            {PROJECT_INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>

          {/* Country Filter */}
          <input
            type="text"
            value={countryFilter}
            onChange={(e) => { setCountryFilter(e.target.value); setPage(1); }}
            placeholder="Country (e.g. US)"
            maxLength={3}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-36"
          />
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Project
                  </th>
                  <th
                    className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition select-none"
                    onClick={() => handleSort("status")}
                  >
                    Status <SortIcon field="status" current={sortBy} order={sortOrder} />
                  </th>
                  <th
                    className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition select-none hidden sm:table-cell"
                    onClick={() => handleSort("industry")}
                  >
                    Industry <SortIcon field="industry" current={sortBy} order={sortOrder} />
                  </th>
                  <th
                    className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition select-none hidden md:table-cell"
                    onClick={() => handleSort("country")}
                  >
                    Country <SortIcon field="country" current={sortBy} order={sortOrder} />
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    Currency
                  </th>
                  <th
                    className="px-4 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition select-none hidden xl:table-cell"
                    onClick={() => handleSort("created_at")}
                  >
                    Created <SortIcon field="created_at" current={sortBy} order={sortOrder} />
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-white/10" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-32 rounded bg-white/10" />
                            <div className="h-2.5 w-24 rounded bg-white/5" />
                          </div>
                        </div>
                      </td>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-3 w-16 rounded bg-white/10" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-20 text-center">
                      <div className="text-4xl mb-3">🌐</div>
                      <div className="text-white font-semibold">No projects found</div>
                      <div className="text-slate-500 text-xs mt-1">
                        {search || statusFilter !== "all" || industryFilter !== "all"
                          ? "Try adjusting your search or filters."
                          : "Create your first client website project to get started."}
                      </div>
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Project Identity */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Logo / Fallback */}
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {project.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={project.logo_url}
                                alt={project.name}
                                className="h-full w-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : (
                              <span className="text-lg font-bold text-indigo-300">
                                {project.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                              {project.name}
                            </div>
                            {project.website_url && (
                              <a
                                href={project.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-slate-500 hover:text-indigo-400 transition truncate max-w-[200px] block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {project.website_url.replace(/^https?:\/\//, "")}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={project.status} />
                      </td>

                      {/* Industry */}
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="text-slate-300">{project.industry || "—"}</span>
                      </td>

                      {/* Country */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-slate-300">{project.country || "—"}</span>
                      </td>

                      {/* Currency */}
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="font-mono text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                          {project.currency}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <span className="text-slate-500 text-xs">
                          {new Date(project.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/settings/projects/${project.id}`)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 border border-white/10 transition text-slate-300"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setDeleteTarget(project)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 transition text-slate-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages} · {total} total projects
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                        p === page
                          ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                          : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onSaved={refreshList}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={refreshList}
        />
      )}
    </div>
  );
}
