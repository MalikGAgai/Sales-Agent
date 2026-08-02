"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiKeyService, copyToClipboard } from "@/services/apiKey";
import {
  ApiKey,
  ApiKeyCreateRequest,
  ApiKeyListParams,
  AVAILABLE_SCOPES,
} from "@/types/apiKey";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDateTime(d?: string | null): string {
  if (!d) return "Never";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ active, expires }: { active: boolean; expires?: string | null }) {
  if (!active)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset bg-rose-500/10 text-rose-400 ring-rose-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        Inactive
      </span>
    );
  if (isExpired(expires))
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset bg-amber-500/10 text-amber-400 ring-amber-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Expired
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset bg-emerald-500/10 text-emerald-400 ring-emerald-500/25">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Active
    </span>
  );
}

function ScopeTag({ scope }: { scope: string }) {
  const colorMap: Record<string, string> = {
    "admin:all": "bg-purple-500/10 text-purple-400 ring-purple-500/25",
    "write:projects": "bg-blue-500/10 text-blue-400 ring-blue-500/25",
    "read:projects": "bg-sky-500/10 text-sky-400 ring-sky-500/25",
    "write:api_keys": "bg-indigo-500/10 text-indigo-400 ring-indigo-500/25",
    "read:api_keys": "bg-violet-500/10 text-violet-400 ring-violet-500/25",
    "write:organization": "bg-orange-500/10 text-orange-400 ring-orange-500/25",
    "read:organization": "bg-yellow-500/10 text-yellow-400 ring-yellow-500/25",
    "read:audit_logs": "bg-teal-500/10 text-teal-400 ring-teal-500/25",
  };
  const cls = colorMap[scope] ?? "bg-slate-500/10 text-slate-400 ring-slate-500/25";
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-mono ring-1 ring-inset ${cls}`}>
      {scope}
    </span>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
        copied
          ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
          : "bg-slate-700/50 text-slate-300 ring-1 ring-slate-600/50 hover:bg-slate-600/50 hover:text-white"
      }`}
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Display Modal (shown once after generate/regenerate)
// ─────────────────────────────────────────────────────────────────────────────

interface TokenModalProps {
  token: string;
  keyName: string;
  onClose: () => void;
}

function TokenModal({ token, keyName, onClose }: TokenModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-amber-500/10">
        {/* Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30">
          <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-semibold text-white">API Key Generated</h3>
        <p className="mb-1 text-sm text-slate-400">
          Key <span className="font-medium text-slate-200">{keyName}</span> was created.
        </p>

        {/* Warning */}
        <div className="my-4 flex items-start gap-3 rounded-lg bg-amber-500/10 px-4 py-3 ring-1 ring-amber-500/25">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-amber-300">
            <strong className="font-semibold">This is the only time you will see this key.</strong> Copy it now and store it securely. You cannot retrieve it again.
          </p>
        </div>

        {/* Token display */}
        <div className="mb-4 overflow-hidden rounded-lg bg-slate-800/80 ring-1 ring-slate-700">
          <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-2">
            <span className="text-xs font-medium text-slate-400">API Key</span>
            <CopyButton text={token} label="Copy Key" />
          </div>
          <div className="px-3 py-3">
            <code className="break-all font-mono text-sm text-emerald-300 select-all">{token}</code>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-slate-700/60 px-4 py-2.5 text-sm font-medium text-slate-200 ring-1 ring-slate-600/50 transition hover:bg-slate-600/60 hover:text-white"
        >
          I've saved the key — close
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create / Edit Modal
// ─────────────────────────────────────────────────────────────────────────────

interface CreateModalProps {
  editKey?: ApiKey | null;
  onClose: () => void;
  onGenerated: (token: string, name: string) => void;
  onUpdated: () => void;
}

function CreateModal({ editKey, onClose, onGenerated, onUpdated }: CreateModalProps) {
  const isEdit = !!editKey;
  const [name, setName] = useState(editKey?.name ?? "");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(editKey?.scopes ?? []);
  const [expiresAt, setExpiresAt] = useState(
    editKey?.expires_at ? editKey.expires_at.split("T")[0] : ""
  );
  const [rateLimit, setRateLimit] = useState<string>(
    editKey?.rate_limit_per_minute?.toString() ?? ""
  );
  const [isActive, setIsActive] = useState(editKey?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleScope = (s: string) =>
    setSelectedScopes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Key name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEdit && editKey) {
        await apiKeyService.updateApiKey(editKey.id, {
          name: name.trim(),
          scopes: selectedScopes,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          rate_limit_per_minute: rateLimit ? parseInt(rateLimit) : null,
          is_active: isActive,
        });
        onUpdated();
      } else {
        const req: ApiKeyCreateRequest = {
          name: name.trim(),
          scopes: selectedScopes,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          rate_limit_per_minute: rateLimit ? parseInt(rateLimit) : null,
        };
        const res = await apiKeyService.createApiKey(req);
        onGenerated(res.key, res.api_key.name);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save key.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              {isEdit ? "Edit API Key" : "Generate New API Key"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {isEdit ? "Update key settings." : "A secure token will be generated."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Key Name <span className="text-rose-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Backend, CI/CD Key"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ring-0 transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          {/* Permissions / Scopes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Permissions (Scopes)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_SCOPES.map((sc) => (
                <button
                  key={sc.value}
                  type="button"
                  onClick={() => toggleScope(sc.value)}
                  className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition-all duration-150 ring-1 ring-inset ${
                    selectedScopes.includes(sc.value)
                      ? "bg-blue-500/15 text-blue-300 ring-blue-500/40"
                      : "bg-slate-800/40 text-slate-400 ring-slate-700/50 hover:bg-slate-700/50 hover:text-slate-200"
                  }`}
                >
                  <span
                    className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-sm border transition-colors ${
                      selectedScopes.includes(sc.value)
                        ? "border-blue-400 bg-blue-500"
                        : "border-slate-600"
                    }`}
                  >
                    {selectedScopes.includes(sc.value) && (
                      <svg viewBox="0 0 12 12" fill="none" className="h-full w-full p-0.5 text-white">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <div className="font-medium leading-tight">{sc.label}</div>
                    <div className="mt-0.5 text-[10px] opacity-70">{sc.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Expiration + Rate Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Expiration Date
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Rate Limit <span className="text-slate-500">(req/min)</span>
              </label>
              <input
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                placeholder="Unlimited"
                min={1}
                max={10000}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
              />
            </div>
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between rounded-lg bg-slate-800/40 px-4 py-3 ring-1 ring-slate-700/50">
              <div>
                <p className="text-sm font-medium text-slate-200">Active Status</p>
                <p className="text-xs text-slate-400">Inactive keys are rejected during validation.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${
                  isActive ? "bg-blue-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400 ring-1 ring-rose-500/25">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-300 ring-1 ring-slate-700/50 transition hover:bg-slate-700/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Generate Key"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirm Modal
// ─────────────────────────────────────────────────────────────────────────────

function DeleteModal({
  keyName,
  onConfirm,
  onClose,
  loading,
}: {
  keyName: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 ring-1 ring-rose-500/30">
          <svg className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white">Delete API Key</h3>
        <p className="mt-2 text-sm text-slate-400">
          Are you sure you want to permanently delete{" "}
          <span className="font-medium text-slate-200">"{keyName}"</span>? This action cannot be undone and will immediately revoke all access using this key.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 ring-1 ring-slate-700 transition hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500 disabled:opacity-50"
          >
            {loading ? "Deleting…" : "Delete Key"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const LIMIT = 10;
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editKey, setEditKey] = useState<ApiKey | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [tokenModal, setTokenModal] = useState<{ token: string; name: string } | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchKeys = useCallback(async (pg = page) => {
    setLoading(true);
    setError("");
    try {
      const params: ApiKeyListParams = {
        page: pg,
        limit: LIMIT,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (filterActive === "active") params.is_active = true;
      if (filterActive === "inactive") params.is_active = false;

      const res = await apiKeyService.listApiKeys(params);
      setKeys(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterActive, sortBy, sortOrder]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchKeys(1);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, filterActive, sortBy, sortOrder]);

  useEffect(() => { fetchKeys(page); }, [page]);

  // ── Sort toggle ────────────────────────────────────────────────────────────

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <span className="ml-1 opacity-30 text-xs">↕</span>;
    return <span className="ml-1 text-blue-400 text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  // ── Regenerate ─────────────────────────────────────────────────────────────

  const handleRegenerate = async (key: ApiKey) => {
    if (!confirm(`Regenerate key "${key.name}"? The current token will be immediately invalidated.`)) return;
    try {
      const res = await apiKeyService.regenerateApiKey(key.id);
      setTokenModal({ token: res.key, name: res.api_key.name });
      fetchKeys(page);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Regeneration failed.");
    }
  };

  // ── Quick toggle active ────────────────────────────────────────────────────

  const handleToggleActive = async (key: ApiKey) => {
    try {
      await apiKeyService.updateApiKey(key.id, { is_active: !key.is_active });
      fetchKeys(page);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Update failed.");
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiKeyService.deleteApiKey(deleteTarget.id);
      setDeleteTarget(null);
      fetchKeys(page);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const COL_HEADERS = [
    { key: "name",        label: "Name" },
    { key: "prefix",      label: "Prefix",   sortable: false },
    { key: "scopes",      label: "Scopes",   sortable: false },
    { key: "usage_count", label: "Usage" },
    { key: "last_used_at",label: "Last Used" },
    { key: "expires_at",  label: "Expires" },
    { key: "is_active",   label: "Status" },
    { key: "rate_limit_per_minute", label: "Rate Limit" },
    { key: "actions",     label: "",         sortable: false },
  ];

  return (
    <>
      {/* Token Display Modal */}
      {tokenModal && (
        <TokenModal
          token={tokenModal.token}
          keyName={tokenModal.name}
          onClose={() => { setTokenModal(null); fetchKeys(page); }}
        />
      )}

      {/* Create / Edit Modal */}
      {(showCreate || editKey) && (
        <CreateModal
          editKey={editKey}
          onClose={() => { setShowCreate(false); setEditKey(null); }}
          onGenerated={(token, name) => {
            setShowCreate(false);
            setEditKey(null);
            setTokenModal({ token, name });
          }}
          onUpdated={() => {
            setShowCreate(false);
            setEditKey(null);
            fetchKeys(page);
          }}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          keyName={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Page */}
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/30">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">API Keys</h1>
                  <p className="text-sm text-slate-400">
                    Manage API keys for programmatic access · {total} total
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Generate Key
            </button>
          </div>

          {/* ── Stats Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total Keys",     value: total,                                 color: "text-blue-400" },
              { label: "Active",         value: keys.filter(k => k.is_active && !isExpired(k.expires_at)).length, color: "text-emerald-400" },
              { label: "Inactive",       value: keys.filter(k => !k.is_active).length, color: "text-rose-400" },
              { label: "Total Requests", value: keys.reduce((a, k) => a + k.usage_count, 0), color: "text-indigo-400" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 ring-1 ring-white/5">
                <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* ── Filters ────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by key name…"
                className="w-full rounded-xl border border-slate-700/60 bg-slate-800/40 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none ring-0 transition focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            {/* Active filter */}
            <div className="flex rounded-xl border border-slate-700/60 bg-slate-800/40 p-1">
              {(["all", "active", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilterActive(f); setPage(1); }}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-150 ${
                    filterActive === f
                      ? "bg-slate-700 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* ── Table ──────────────────────────────────────────────────────── */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
            {error && (
              <div className="border-b border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80">
                    {COL_HEADERS.map((h) => (
                      <th
                        key={h.key}
                        onClick={() => h.sortable !== false && h.key !== "actions" && h.key !== "scopes" && h.key !== "prefix" ? handleSort(h.key) : undefined}
                        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                          h.sortable !== false && h.key !== "actions" ? "cursor-pointer select-none hover:text-slate-200" : ""
                        }`}
                      >
                        {h.label}
                        {h.sortable !== false && h.key !== "actions" && h.key !== "scopes" && h.key !== "prefix" && (
                          <SortIcon col={h.key} />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {COL_HEADERS.map((h) => (
                          <td key={h.key} className="px-4 py-3.5">
                            <div className="h-4 rounded-md bg-slate-800" style={{ width: `${50 + (i * 17 + COL_HEADERS.indexOf(h) * 13) % 40}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : keys.length === 0 ? (
                    <tr>
                      <td colSpan={COL_HEADERS.length} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 ring-1 ring-slate-700">
                            <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-300">No API keys found</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {search ? "Try a different search term." : "Generate your first API key to get started."}
                            </p>
                          </div>
                          {!search && (
                            <button
                              onClick={() => setShowCreate(true)}
                              className="mt-1 rounded-lg bg-blue-600/20 px-4 py-2 text-xs font-medium text-blue-400 ring-1 ring-blue-500/30 transition hover:bg-blue-600/30"
                            >
                              Generate Key
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    keys.map((key) => (
                      <tr key={key.id} className="group transition-colors hover:bg-slate-800/30">
                        {/* Name */}
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-200">{key.name}</div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            Created {fmtDate(key.created_at)}
                          </div>
                        </td>

                        {/* Prefix */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <code className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300 ring-1 ring-slate-700">
                              {key.prefix}…
                            </code>
                            <CopyButton text={key.prefix} label="" />
                          </div>
                        </td>

                        {/* Scopes */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                            {key.scopes.length === 0 ? (
                              <span className="text-xs text-slate-500">None</span>
                            ) : (
                              key.scopes.slice(0, 3).map((s) => <ScopeTag key={s} scope={s} />)
                            )}
                            {key.scopes.length > 3 && (
                              <span className="text-xs text-slate-400">+{key.scopes.length - 3}</span>
                            )}
                          </div>
                        </td>

                        {/* Usage */}
                        <td className="px-4 py-3.5">
                          <div className="text-sm font-medium tabular-nums text-slate-300">
                            {key.usage_count.toLocaleString()}
                          </div>
                        </td>

                        {/* Last Used */}
                        <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                          {fmtDateTime(key.last_used_at)}
                        </td>

                        {/* Expires */}
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                          {!key.expires_at ? (
                            <span className="text-slate-500">Never</span>
                          ) : isExpired(key.expires_at) ? (
                            <span className="text-amber-400">{fmtDate(key.expires_at)}</span>
                          ) : (
                            <span className="text-slate-300">{fmtDate(key.expires_at)}</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge active={key.is_active} expires={key.expires_at} />
                        </td>

                        {/* Rate Limit */}
                        <td className="px-4 py-3.5 text-xs text-slate-400">
                          {key.rate_limit_per_minute ? (
                            <span className="font-medium text-slate-300">
                              {key.rate_limit_per_minute}<span className="text-slate-500">/min</span>
                            </span>
                          ) : (
                            <span className="text-slate-500">Unlimited</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {/* Edit */}
                            <button
                              onClick={() => setEditKey(key)}
                              title="Edit"
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>

                            {/* Regenerate */}
                            <button
                              onClick={() => handleRegenerate(key)}
                              title="Regenerate"
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-amber-500/15 hover:text-amber-400"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                              </svg>
                            </button>

                            {/* Toggle active */}
                            <button
                              onClick={() => handleToggleActive(key)}
                              title={key.is_active ? "Deactivate" : "Activate"}
                              className={`rounded-lg p-1.5 transition ${key.is_active ? "text-slate-400 hover:bg-rose-500/15 hover:text-rose-400" : "text-slate-400 hover:bg-emerald-500/15 hover:text-emerald-400"}`}
                            >
                              {key.is_active ? (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(key)}
                              title="Delete"
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-400"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ─────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
                <p className="text-xs text-slate-400">
                  Page {page} of {totalPages} · {total} keys
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 ring-1 ring-slate-700 transition hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`min-w-[32px] rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          pg === page
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-400 ring-1 ring-slate-700 hover:bg-slate-800 hover:text-slate-200"
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 ring-1 ring-slate-700 transition hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Security Notice ────────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Security Notes</h4>
                <ul className="mt-1.5 space-y-0.5 text-xs text-slate-400">
                  <li>• API keys are stored as one-way SHA-256 hashes — the plain token is shown <strong className="text-slate-300">only once</strong> upon creation.</li>
                  <li>• Regenerating a key immediately invalidates the previous token — update all consumers before regenerating.</li>
                  <li>• Use the minimum scopes required — avoid <code className="font-mono text-purple-400">admin:all</code> unless absolutely necessary.</li>
                  <li>• Set rate limits to prevent abuse. Expired keys are automatically rejected during validation.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
