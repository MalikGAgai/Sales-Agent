"use client";

import { useState } from "react";

export interface LoginSession {
  id: string;
  user: string;
  ipAddress: string;
  location: string;
  device: string;
  status: "success" | "failed" | "mfa_challenge";
  timestamp: string;
}

const INITIAL_LOGINS: LoginSession[] = [
  {
    id: "sess-1",
    user: "alex.morgan@acmecorp.io",
    ipAddress: "192.168.1.104",
    location: "San Francisco, US",
    device: "Chrome / macOS",
    status: "success",
    timestamp: "10 mins ago",
  },
  {
    id: "sess-2",
    user: "sarah.connor@acmecorp.io",
    ipAddress: "172.16.0.42",
    location: "New York, US",
    device: "Firefox / Windows",
    status: "success",
    timestamp: "45 mins ago",
  },
  {
    id: "sess-3",
    user: "devon.miles@acmecorp.io",
    ipAddress: "10.0.4.12",
    location: "London, UK",
    device: "Safari / iOS",
    status: "success",
    timestamp: "2 hours ago",
  },
  {
    id: "sess-4",
    user: "unknown@malicious-ip.com",
    ipAddress: "185.220.101.4",
    location: "Frankfurt, DE",
    device: "Python-Requests",
    status: "failed",
    timestamp: "4 hours ago",
  },
];

export function LoginsTable() {
  const [sessions] = useState<LoginSession[]>(INITIAL_LOGINS);

  const getStatusBadge = (status: LoginSession["status"]) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Authenticated
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 ring-1 ring-inset ring-rose-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Failed Attempt
          </span>
        );
      case "mfa_challenge":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            MFA Challenge
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-white">Recent Authentication Logins</h3>
          <p className="text-xs text-slate-400">Security audit log of recent active sessions and login attempts</p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
          {sessions.length} Sessions Logged
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">User Account</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">Device / Client</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sessions.map((sess) => (
              <tr key={sess.id} className="hover:bg-slate-800/40 transition">
                <td className="px-4 py-3.5 font-medium text-white">{sess.user}</td>
                <td className="px-4 py-3.5">
                  <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
                    {sess.ipAddress}
                  </code>
                </td>
                <td className="px-4 py-3.5 text-slate-400">{sess.device}</td>
                <td className="px-4 py-3.5 text-slate-400">{sess.location}</td>
                <td className="px-4 py-3.5">{getStatusBadge(sess.status)}</td>
                <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{sess.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
