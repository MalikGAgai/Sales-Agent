"use client";

import { useState } from "react";
import { MetricCards, MetricData } from "@/components/dashboard/metric-cards";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { LoginsTable } from "@/components/dashboard/logins-table";

export default function SaaSPage() {
  // Demo State Simulation Controls (Normal, Loading, Empty, Error)
  const [viewState, setViewState] = useState<"normal" | "loading" | "empty" | "error">("normal");

  const MOCK_METRICS: MetricData = {
    organizations: { total: 4, active: 4, growth: "+12.5%" },
    projects: { total: 18, active: 15, growth: "+24.8%" },
    users: { total: 12, active: 10, growth: "+18.2%" },
    apiKeys: { total: 8, active: 7, requests: 142890, growth: "+34.1%" },
  };

  const EMPTY_METRICS: MetricData = {
    organizations: { total: 0, active: 0, growth: "0.0%" },
    projects: { total: 0, active: 0, growth: "0.0%" },
    users: { total: 0, active: 0, growth: "0.0%" },
    apiKeys: { total: 0, active: 0, requests: 0, growth: "0.0%" },
  };

  return (
    <div className="space-y-8">
      {/* ── Top Header & State Simulator ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              SaaS Overview Dashboard
            </h1>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 ring-1 ring-blue-500/30">
              Live
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time analytics, client projects, team activity, and security telemetry for Acme Corp.
          </p>
        </div>

        {/* Interactive State Selector Bar */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 shadow-md">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">State:</span>
          {(["normal", "loading", "empty", "error"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setViewState(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                viewState === st
                  ? st === "error"
                    ? "bg-rose-600 text-white"
                    : st === "empty"
                    ? "bg-amber-600 text-white"
                    : st === "loading"
                    ? "bg-purple-600 text-white"
                    : "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error State Banner ────────────────────────────────────────────────── */}
      {viewState === "error" && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-rose-200">Failed to sync real-time SaaS metrics</h3>
              <p className="mt-1 text-xs text-rose-300">
                Network timeout while connecting to telemetry service. PostgreSQL connection pool reset required.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setViewState("normal")}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-500 transition"
                >
                  Retry Connection
                </button>
                <button
                  onClick={() => setViewState("normal")}
                  className="rounded-lg border border-rose-500/30 bg-slate-900/60 px-4 py-2 text-xs font-medium text-rose-300 hover:bg-slate-900 transition"
                >
                  Dismiss Error
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading Skeleton State ────────────────────────────────────────────── */}
      {viewState === "loading" ? (
        <div className="space-y-8 animate-pulse">
          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
                <div className="h-4 w-24 rounded bg-slate-800" />
                <div className="h-8 w-16 rounded bg-slate-800" />
                <div className="h-4 w-32 rounded bg-slate-800" />
              </div>
            ))}
          </div>

          {/* Skeleton Chart & Activity */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 h-80 rounded-2xl border border-slate-800 bg-slate-900/40 p-6" />
            <div className="h-80 rounded-2xl border border-slate-800 bg-slate-900/40 p-6" />
          </div>
        </div>
      ) : viewState === "empty" ? (
        /* ── Empty Workspace State ───────────────────────────────────────────── */
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 py-20 px-6 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-white">Welcome to your SalesAI Workspace!</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            You don't have any client projects or API keys configured yet. Start by onboarding your first project or generating an API key.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/settings/projects"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              + Create Client Project
            </a>
            <a
              href="/settings/api-keys"
              className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Generate API Key
            </a>
          </div>
        </div>
      ) : (
        /* ── Normal State (Main Dashboard View) ─────────────────────────────── */
        <>
          {/* 4 Metric Cards */}
          <MetricCards data={MOCK_METRICS} />

          {/* Traffic Chart & Activity Feed Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrafficChart />
            </div>
            <div>
              <ActivityFeed />
            </div>
          </div>

          {/* Logins Table */}
          <LoginsTable />
        </>
      )}
    </div>
  );
}
