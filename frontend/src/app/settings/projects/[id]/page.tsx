"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { projectService } from "@/services/project";
import {
  ProjectDetail,
  ProjectUpdateRequest,
  PROJECT_CURRENCIES,
  PROJECT_INDUSTRIES,
  PROJECT_STATUSES,
  TIMEZONES,
} from "@/types/project";

// ── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  onboarding: "bg-blue-500/15 text-blue-400 ring-blue-500/25",
  maintenance: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
  archived: "bg-slate-500/15 text-slate-400 ring-slate-500/25",
};

function StatusBadge({ status }: { status: string }) {
  const label = PROJECT_STATUSES.find((s) => s.value === status)?.label ?? status;
  const cls = STATUS_STYLES[status] ?? "bg-slate-500/15 text-slate-400 ring-slate-500/25";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

// ── Audit Action Label ────────────────────────────────────────────────────────

function auditActionLabel(action: string) {
  const map: Record<string, { emoji: string; label: string; color: string }> = {
    "project.created": { emoji: "✨", label: "Project Created", color: "text-emerald-400" },
    "project.updated": { emoji: "✏️", label: "Project Updated", color: "text-indigo-400" },
    "project.deleted": { emoji: "🗑️", label: "Project Deleted", color: "text-red-400" },
  };
  return map[action] ?? { emoji: "📋", label: action, color: "text-slate-400" };
}

// ── Input helper ──────────────────────────────────────────────────────────────

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition";
const selectCls =
  "w-full px-4 py-2.5 rounded-xl bg-[#1a2332] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition";

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit form state
  const [form, setForm] = useState<ProjectUpdateRequest>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Load project ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    projectService
      .getProject(projectId)
      .then((data) => {
        setProject(data);
        setForm({
          name: data.name,
          website_url: data.website_url ?? "",
          country: data.country ?? "",
          timezone: data.timezone ?? "UTC",
          industry: data.industry ?? "",
          currency: data.currency,
          status: data.status,
          logo_url: data.logo_url ?? "",
          description: data.description ?? "",
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load project.");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaveSuccess(false);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await projectService.updateProject(projectId, form);
      // Refresh detail to get new audit logs
      const detail = await projectService.getProject(projectId);
      setProject(detail);
      setForm({
        name: updated.name,
        website_url: updated.website_url ?? "",
        country: updated.country ?? "",
        timezone: updated.timezone ?? "UTC",
        industry: updated.industry ?? "",
        currency: updated.currency,
        status: updated.status,
        logo_url: updated.logo_url ?? "",
        description: updated.description ?? "",
      });
      setSaveSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectService.deleteProject(projectId);
      router.push("/settings/projects");
    } catch {
      setError("Failed to delete project.");
      setDeleting(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-white/10" />
          <div className="h-[400px] rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  // ── 404 / Error ─────────────────────────────────────────────────────────────
  if (!project) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl">🌐</div>
          <h2 className="text-xl font-bold">Project Not Found</h2>
          <p className="text-slate-400 text-sm">{error || "This project does not exist or has been deleted."}</p>
          <button
            onClick={() => router.push("/settings/projects")}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── Breadcrumb + Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <button
              onClick={() => router.push("/settings/projects")}
              className="text-slate-500 hover:text-indigo-400 text-sm flex items-center gap-1.5 mb-3 transition"
            >
              ← Back to Projects
            </button>
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {project.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.logo_url}
                    alt={project.name}
                    className="h-full w-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <span className="text-xl font-bold text-indigo-300">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">{project.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge status={project.status} />
                  {project.website_url && (
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-indigo-400 transition"
                    >
                      {project.website_url.replace(/^https?:\/\//, "")} ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Delete */}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition self-start"
            >
              🗑️ Delete Project
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
              <span className="text-xs text-red-400 font-medium">Confirm delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 rounded-lg border border-white/10 text-slate-400 text-xs hover:bg-white/5 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── Edit Form ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-white/10">
            <h2 className="text-lg font-bold">Project Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Slug: <code className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-indigo-300">{project.slug}</code>
            </p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* Name */}
            <FormField label="Project Name *">
              <input
                name="name"
                value={form.name ?? ""}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={255}
                placeholder="Acme Technologies Website"
                className={inputCls}
              />
            </FormField>

            {/* Website URL */}
            <FormField label="Website URL">
              <input
                name="website_url"
                value={form.website_url ?? ""}
                onChange={handleChange}
                type="url"
                placeholder="https://acme.com"
                className={inputCls}
              />
            </FormField>

            {/* Logo URL + Preview */}
            <FormField label="Logo URL">
              <div className="flex items-center gap-3">
                <input
                  name="logo_url"
                  value={form.logo_url ?? ""}
                  onChange={handleChange}
                  placeholder="https://acme.com/logo.png"
                  className={inputCls}
                />
                {form.logo_url && (
                  <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logo_url}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>
            </FormField>

            {/* Row: Country + Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Country">
                <input
                  name="country"
                  value={form.country ?? ""}
                  onChange={handleChange}
                  placeholder="US, GB, PK…"
                  maxLength={100}
                  className={inputCls}
                />
              </FormField>
              <FormField label="Timezone">
                <select name="timezone" value={form.timezone ?? "UTC"} onChange={handleChange} className={selectCls}>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Row: Industry + Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Industry">
                <select name="industry" value={form.industry ?? ""} onChange={handleChange} className={selectCls}>
                  <option value="">Select industry…</option>
                  {PROJECT_INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Currency">
                <select name="currency" value={form.currency ?? "USD"} onChange={handleChange} className={selectCls}>
                  {PROJECT_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Status */}
            <FormField label="Status">
              <select name="status" value={form.status ?? "active"} onChange={handleChange} className={selectCls}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>

            {/* Description */}
            <FormField label="Description">
              <textarea
                name="description"
                value={form.description ?? ""}
                onChange={handleChange}
                rows={4}
                placeholder="Brief description of this client website…"
                className={`${inputCls} resize-none`}
              />
            </FormField>

            {/* Save Button */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              {saveSuccess && (
                <span className="text-sm text-emerald-400 flex items-center gap-1.5">
                  <span>✓</span> Changes saved successfully
                </span>
              )}
            </div>
          </form>
        </div>

        {/* ── Audit Log Timeline ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-white/10">
            <h2 className="text-lg font-bold">Audit Log</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable activity timeline for this project — {project.audit_logs.length} event
              {project.audit_logs.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="px-6 py-4">
            {project.audit_logs.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center">No audit events recorded yet.</p>
            ) : (
              <ol className="relative border-l border-white/10 ml-3 space-y-6 py-2">
                {[...project.audit_logs].reverse().map((log) => {
                  const { emoji, label, color } = auditActionLabel(log.action);
                  return (
                    <li key={log.id} className="ml-6">
                      {/* Timeline dot */}
                      <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#1a2332] border border-white/15 text-xs">
                        {emoji}
                      </span>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className={`text-sm font-semibold ${color}`}>{label}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(log.created_at).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Details */}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(log.details).map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-mono"
                            >
                              <span className="text-slate-400">{k}:</span>
                              <span className="text-slate-200">{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* ── Meta Info ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Project ID", value: project.id.slice(0, 8) + "…", mono: true },
            {
              label: "Created",
              value: new Date(project.created_at).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric",
              }),
            },
            {
              label: "Last Updated",
              value: new Date(project.updated_at).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric",
              }),
            },
            { label: "Organization", value: project.organization_id.slice(0, 8) + "…", mono: true },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 space-y-1"
            >
              <div className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</div>
              <div className={`text-sm text-slate-300 ${item.mono ? "font-mono" : ""}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
