"use client";

import { useState } from "react";

export function TrafficChart() {
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "90d">("7d");
  const [hoverPoint, setHoverPoint] = useState<number | null>(null);

  const TRAFFIC_DATA: Record<string, { label: string; requests: number; errors: number }[]> = {
    "24h": [
      { label: "00:00", requests: 3400, errors: 12 },
      { label: "04:00", requests: 1200, errors: 4 },
      { label: "08:00", requests: 6800, errors: 28 },
      { label: "12:00", requests: 12400, errors: 52 },
      { label: "16:00", requests: 15800, errors: 64 },
      { label: "20:00", requests: 9200, errors: 31 },
    ],
    "7d": [
      { label: "Mon", requests: 18400, errors: 65 },
      { label: "Tue", requests: 22100, errors: 84 },
      { label: "Wed", requests: 25400, errors: 92 },
      { label: "Thu", requests: 29800, errors: 110 },
      { label: "Fri", requests: 31200, errors: 98 },
      { label: "Sat", requests: 14500, errors: 42 },
      { label: "Sun", requests: 12100, errors: 35 },
    ],
    "30d": [
      { label: "Week 1", requests: 120000, errors: 450 },
      { label: "Week 2", requests: 145000, errors: 510 },
      { label: "Week 3", requests: 168000, errors: 620 },
      { label: "Week 4", requests: 189000, errors: 710 },
    ],
    "90d": [
      { label: "May", requests: 480000, errors: 1800 },
      { label: "Jun", requests: 590000, errors: 2100 },
      { label: "Jul", requests: 720000, errors: 2600 },
    ],
  };

  const points = TRAFFIC_DATA[timeframe];
  const maxReq = Math.max(...points.map((p) => p.requests));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl">
      {/* Header & Timescale Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">API Traffic & Request Volume</h3>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 ring-1 ring-blue-500/30">
              Live Metrics
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time HTTP throughput, error rates, and response latency across all client endpoints
          </p>
        </div>

        {/* Timescale buttons */}
        <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1">
          {(["24h", "7d", "30d", "90d"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf);
                setHoverPoint(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                timeframe === tf
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="my-5 grid grid-cols-3 gap-4 rounded-xl bg-slate-950/60 p-4 border border-slate-800/60">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Volume</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-white">
            {points.reduce((a, b) => a + b.requests, 0).toLocaleString()} <span className="text-xs text-slate-500 font-normal">reqs</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Error Rate</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-400">
            0.28% <span className="text-xs text-slate-500 font-normal">(Healthy)</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Latency</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-indigo-400">
            34ms <span className="text-xs text-slate-500 font-normal">p99</span>
          </p>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="relative mt-6 h-56 w-full">
        {/* SVG Area Line Chart */}
        <div className="flex h-44 items-end gap-3 sm:gap-6 pt-4 px-2">
          {points.map((pt, idx) => {
            const pct = Math.max(12, Math.round((pt.requests / maxReq) * 100));
            const isHovered = hoverPoint === idx;

            return (
              <div
                key={pt.label}
                onMouseEnter={() => setHoverPoint(idx)}
                onMouseLeave={() => setHoverPoint(null)}
                className="group relative flex flex-1 flex-col items-center h-full justify-end cursor-pointer"
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 shadow-2xl text-center min-w-[100px]">
                    <p className="text-[10px] font-bold text-slate-400">{pt.label}</p>
                    <p className="text-xs font-bold text-white">{pt.requests.toLocaleString()} reqs</p>
                    <p className="text-[10px] text-rose-400">{pt.errors} errors</p>
                  </div>
                )}

                {/* Animated Bar */}
                <div
                  style={{ height: `${pct}%` }}
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isHovered
                      ? "bg-gradient-to-t from-blue-600 via-indigo-500 to-purple-400 shadow-lg shadow-blue-500/40 scale-105"
                      : "bg-gradient-to-t from-blue-600/80 to-indigo-500/60 hover:from-blue-500 hover:to-indigo-400"
                  }`}
                />

                {/* Label */}
                <span className="mt-2 text-[11px] font-semibold text-slate-400 group-hover:text-white transition-colors">
                  {pt.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
