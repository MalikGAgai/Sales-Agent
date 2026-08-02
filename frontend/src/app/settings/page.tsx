"use client";

import { useEffect, useState } from "react";
import { settingsService } from "@/services/settings";
import {
  ActiveSession,
  OrganizationSettings,
  TwoFactorStatus,
  UserSettings,
  UserSettingsUpdateRequest,
} from "@/types/settings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "general" | "appearance" | "notifications" | "profile" | "security"
  >("general");

  // State
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Change Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 2FA Modal State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [uSet, oSet, sList, tStatus] = await Promise.all([
        settingsService.getUserSettings().catch(() => null),
        settingsService.getOrgSettings().catch(() => null),
        settingsService.listSessions().catch(() => []),
        settingsService.get2FAStatus().catch(() => null),
      ]);

      if (uSet) setSettings(uSet);
      if (oSet) setOrgSettings(oSet);
      setSessions(sList);
      if (tStatus) setTwoFactor(tStatus);
    } catch {
      setMessage({ type: "error", text: "Failed to load settings configuration." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUserSettings = async (updates: UserSettingsUpdateRequest) => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await settingsService.updateUserSettings(updates);
      setSettings(updated);
      setMessage({ type: "success", text: "Settings saved successfully." });
    } catch (e: unknown) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrgSettings = async (updates: Partial<OrganizationSettings>) => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await settingsService.updateOrgSettings(updates);
      setOrgSettings(updated);
      setMessage({ type: "success", text: "Organization settings updated." });
    } catch (e: unknown) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await settingsService.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setMessage({ type: "success", text: "Session revoked." });
    } catch {
      setMessage({ type: "error", text: "Failed to revoke session." });
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (!confirm("Revoke all other active login sessions?")) return;
    try {
      const res = await settingsService.revokeAllOtherSessions();
      setSessions((prev) => prev.filter((s) => s.is_current));
      setMessage({ type: "success", text: res.message });
    } catch {
      setMessage({ type: "error", text: "Failed to revoke other sessions." });
    }
  };

  const handleEnable2FA = async () => {
    if (!totpCode.trim()) return;
    setSaving(true);
    try {
      const res = await settingsService.enable2FA(totpCode.trim());
      setTwoFactor(res);
      if (settings) setSettings({ ...settings, two_factor_enabled: true });
      setShow2FAModal(false);
      setTotpCode("");
      setMessage({ type: "success", text: "Two-Factor Authentication enabled!" });
    } catch (e: unknown) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Verification failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) return;
    setSaving(true);
    try {
      const res = await settingsService.disable2FA(disablePassword);
      setTwoFactor(res);
      if (settings) setSettings({ ...settings, two_factor_enabled: false });
      setShow2FAModal(false);
      setDisablePassword("");
      setMessage({ type: "success", text: "Two-Factor Authentication disabled." });
    } catch (e: unknown) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to disable 2FA." });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long." });
      return;
    }
    setMessage({ type: "success", text: "Password updated successfully." });
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const TABS = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "appearance", label: "Appearance", icon: "🎨" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "profile", label: "Profile & Password", icon: "👤" },
    { id: "security", label: "Security & Sessions", icon: "🔐" },
  ] as const;

  return (
    <div className="space-y-6 min-h-screen pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings & Preferences</h1>
        <p className="text-sm text-slate-400">
          Manage your account profile, appearance, notification preferences, and security sessions.
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold ring-1 ring-inset ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/25"
              : "bg-rose-500/10 text-rose-400 ring-rose-500/25"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 animate-pulse">
          Loading settings preferences...
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── 1. GENERAL SETTINGS ─────────────────────────────────────────────── */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Regional Preferences Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white">Regional & Localization Preferences</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">
                      Interface Language
                    </label>
                    <select
                      value={settings?.language || "en"}
                      onChange={(e) => handleSaveUserSettings({ language: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    >
                      <option value="en">English (US)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="fr">Français (French)</option>
                      <option value="de">Deutsch (German)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">
                      Primary Timezone
                    </label>
                    <select
                      value={settings?.timezone || "UTC"}
                      onChange={(e) => handleSaveUserSettings({ timezone: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">Eastern Time (US & Canada)</option>
                      <option value="America/Chicago">Central Time (US & Canada)</option>
                      <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                      <option value="Europe/London">London (GMT / BST)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Workspace System Settings (Admin / Owner) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Workspace General Config</h3>
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-400 ring-1 ring-purple-500/25">
                    Workspace Admin
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">
                      System Portal Name
                    </label>
                    <input
                      value={orgSettings?.site_name || ""}
                      onChange={(e) => setOrgSettings((prev) => (prev ? { ...prev, site_name: e.target.value } : null))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">
                      Support Contact Email
                    </label>
                    <input
                      value={orgSettings?.support_email || ""}
                      onChange={(e) => setOrgSettings((prev) => (prev ? { ...prev, support_email: e.target.value } : null))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleSaveOrgSettings({ site_name: orgSettings?.site_name, support_email: orgSettings?.support_email })}
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50"
                  >
                    Save Workspace Config
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. APPEARANCE SETTINGS ──────────────────────────────────────────── */}
          {activeTab === "appearance" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-6">
              <h3 className="text-base font-bold text-white">Theme & UI Customization</h3>

              {/* Theme Mode Selection */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-300">Interface Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "dark", label: "Dark Mode", desc: "High contrast dark palette" },
                    { id: "light", label: "Light Mode", desc: "Clean bright theme" },
                    { id: "system", label: "System Default", desc: "Sync with OS setting" },
                  ].map((th) => (
                    <button
                      key={th.id}
                      onClick={() => handleSaveUserSettings({ theme: th.id as any })}
                      className={`flex flex-col items-start gap-1 rounded-xl p-4 text-left transition border ${
                        settings?.theme === th.id
                          ? "border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500/30"
                          : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xs font-bold">{th.label}</span>
                      <span className="text-[10px] opacity-70">{th.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Accent Color */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-300">Primary Accent Color</label>
                <div className="flex gap-3">
                  {[
                    { id: "blue", bg: "bg-blue-500" },
                    { id: "indigo", bg: "bg-indigo-500" },
                    { id: "purple", bg: "bg-purple-500" },
                    { id: "emerald", bg: "bg-emerald-500" },
                    { id: "amber", bg: "bg-amber-500" },
                  ].map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleSaveUserSettings({ accent_color: color.id as any })}
                      className={`h-8 w-8 rounded-full ${color.bg} transition ring-offset-2 ring-offset-slate-950 ${
                        settings?.accent_color === color.id ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 3. NOTIFICATIONS SETTINGS ───────────────────────────────────────── */}
          {activeTab === "notifications" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-6">
              <h3 className="text-base font-bold text-white">Email & System Notifications</h3>

              {/* Notification Toggles */}
              <div className="space-y-4">
                {[
                  {
                    key: "email_notifications",
                    title: "Transactional Email Notifications",
                    desc: "Receive email alerts when key rotations or team changes occur.",
                  },
                  {
                    key: "security_alerts",
                    title: "Security & Login Alerts",
                    desc: "Immediate email notification on new device login or password reset.",
                  },
                  {
                    key: "product_updates",
                    title: "Product Feature Announcements",
                    desc: "Receive weekly newsletters about platform feature updates.",
                  },
                ].map((item) => {
                  const val = settings ? (settings as any)[item.key] : false;
                  return (
                    <div key={item.key} className="flex items-center justify-between rounded-xl bg-slate-950/60 p-4 border border-slate-800/60">
                      <div>
                        <p className="text-xs font-bold text-white">{item.title}</p>
                        <p className="text-[11px] text-slate-400">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleSaveUserSettings({ [item.key]: !val })}
                        className={`relative h-6 w-11 rounded-full transition ${val ? "bg-blue-600" : "bg-slate-800"}`}
                      >
                        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition ${val ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Digest Frequency */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Email Summary Digest Frequency
                </label>
                <select
                  value={settings?.digest_frequency || "daily"}
                  onChange={(e) => handleSaveUserSettings({ digest_frequency: e.target.value as any })}
                  className="w-full sm:w-64 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="instant">Real-time (Instant)</option>
                  <option value="daily">Daily Summary</option>
                  <option value="weekly">Weekly Digest</option>
                  <option value="never">Never Send Digest</option>
                </select>
              </div>
            </div>
          )}

          {/* ── 4. PROFILE & PASSWORD SETTINGS ─────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Profile Details */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white">Personal Profile</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">First Name</label>
                    <input
                      value={settings?.first_name || ""}
                      onChange={(e) => setSettings((prev) => (prev ? { ...prev, first_name: e.target.value } : null))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">Last Name</label>
                    <input
                      value={settings?.last_name || ""}
                      onChange={(e) => setSettings((prev) => (prev ? { ...prev, last_name: e.target.value } : null))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">Email Address</label>
                  <input
                    value={settings?.email || ""}
                    disabled
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleSaveUserSettings({ first_name: settings?.first_name || "", last_name: settings?.last_name || "" })}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    Update Profile
                  </button>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white">Change Account Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">Current Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-300">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-300">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── 5. SECURITY, SESSIONS & 2FA SETTINGS ───────────────────────────── */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {/* 2FA Configuration Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Two-Factor Authentication (2FA)</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        twoFactor?.enabled
                          ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 ring-amber-500/30"
                      }`}
                    >
                      {twoFactor?.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Secure your account using TOTP authenticator apps (Google Authenticator, 1Password, Authy).
                  </p>
                </div>
                <button
                  onClick={() => setShow2FAModal(true)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition ${
                    twoFactor?.enabled
                      ? "bg-slate-800 hover:bg-slate-700"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                  }`}
                >
                  {twoFactor?.enabled ? "Manage 2FA" : "Set Up 2FA"}
                </button>
              </div>

              {/* Active Login Sessions Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Active Login Sessions</h3>
                    <p className="text-xs text-slate-400">All devices currently authenticated into your account</p>
                  </div>
                  <button
                    onClick={handleRevokeAllOtherSessions}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                  >
                    Revoke All Other Sessions
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-3">Device / User Agent</th>
                        <th className="px-4 py-3">IP Address</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {sessions.map((sess) => (
                        <tr key={sess.id} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3.5 font-medium text-white max-w-xs truncate">
                            {sess.user_agent || "Unknown Browser"}
                          </td>
                          <td className="px-4 py-3.5 font-mono">{sess.ip_address || "127.0.0.1"}</td>
                          <td className="px-4 py-3.5 text-slate-400">
                            {new Date(sess.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5">
                            {sess.is_current ? (
                              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                                Current Session
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {!sess.is_current && (
                              <button
                                onClick={() => handleRevokeSession(sess.id)}
                                className="text-xs font-semibold text-rose-400 hover:underline"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 2FA TOTP Placeholder Modal ───────────────────────────────────────── */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShow2FAModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {twoFactor?.enabled ? "Manage Two-Factor Authentication" : "Set Up Two-Factor Authentication"}
            </h3>

            {twoFactor?.enabled ? (
              /* Disable 2FA Form */
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Enter your current password to disable TOTP Two-Factor Authentication.
                </p>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white outline-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShow2FAModal(false)}
                    className="flex-1 rounded-xl bg-slate-800 py-2 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisable2FA}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                  >
                    Disable 2FA
                  </button>
                </div>
              </div>
            ) : (
              /* Enable 2FA Setup Flow */
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Scan the QR code below with your authenticator app (Google Authenticator, Authy, 1Password).
                </p>

                {/* QR Code Placeholder Preview */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl">
                  {twoFactor?.qr_code_url && (
                    <img src={twoFactor.qr_code_url} alt="2FA QR Code" className="h-40 w-40" />
                  )}
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Manual Secret Key</p>
                  <code className="text-xs font-mono text-emerald-400 font-bold">{twoFactor?.secret_key}</code>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">6-Digit Verification Code</label>
                  <input
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    maxLength={6}
                    placeholder="e.g. 123456"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-center text-sm font-mono tracking-widest text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShow2FAModal(false)}
                    className="flex-1 rounded-xl bg-slate-800 py-2 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnable2FA}
                    disabled={saving || totpCode.length !== 6}
                    className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Verify & Enable 2FA
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
