"use client";

import { useState } from "react";

export interface ActivityItem {
  id: string;
  action: string;
  actor: string;
  actorRole: string;
  target: string;
  timestamp: string;
  category: "project" | "api_key" | "security" | "organization";
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    action: "api_key.created",
    actor: "Alex Morgan",
    actorRole: "Owner",
    target: "Production-Gateway-V2",
    timestamp: "12 mins ago",
    category: "api_key",
  },
  {
    id: "act-2",
    action: "project.created",
    actor: "Sarah Connor",
    actorRole: "Admin",
    target: "Acme E-Commerce Portal",
    timestamp: "45 mins ago",
    category: "project",
  },
  {
    id: "act-3",
    action: "organization.updated",
    actor: "Alex Morgan",
    actorRole: "Owner",
    target: "Acme Corp Settings",
    timestamp: "2 hours ago",
    category: "organization",
  },
  {
    id: "act-4",
    action: "api_key.regenerated",
    actor: "Devon Miles",
    actorRole: "Developer",
    target: "CI/CD-Deployment-Key",
    timestamp: "3 hours ago",
    category: "api_key",
  },
  {
    id: "act-5",
    action: "user.login",
    actor: "Sarah Connor",
    actorRole: "Admin",
    target: "Web Console (192.168.1.45)",
    timestamp: "5 hours ago",
    category: "security",
  },
  {
    id: "act-6",
    action: "project.updated",
    actor: "Alex Morgan",
    actorRole: "Owner",
    target: "Staging Website Workspace",
    timestamp: "1 day ago",
    category: "project",
  },
];

export function ActivityFeed() {
  const [activities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filtered = activities.filter((act) => {
    const matchesCat = filterCategory === "all" || act.category === filterCategory;
    const matchesSearch =
      !search.trim() ||
      act.action.toLowerCase().includes(search.toLowerCase()) ||
      act.actor.toLowerCase().includes(search.toLowerCase()) ||
      act.target.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getBadgeStyle = (cat: ActivityItem["category"]) => {
    switch (cat) {
      case "api_key":
        return "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30";
      case "project":
        return "bg-blue-500/15 text-blue-400 ring-blue-500/30";
      case "organization":
        return "bg-purple-500/15 text-purple-400 ring-purple-500/30";
      case "security":
        return "bg-amber-500/15 text-amber-400 ring-amber-500/30";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-white">Recent Workspace Activity</h3>
          <p className="text-xs text-slate-400">Real-time audit log stream of user actions and integrations</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 outline-none transition focus:border-blue-500/50"
          >
            <option value="all">All Categories</option>
            <option value="api_key">API Keys</option>
            <option value="project">Projects</option>
            <option value="organization">Organization</option>
            <option value="security">Security</option>
          </select>
        </div>
      </div>

      {/* Filter Input */}
      <div className="my-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter activity stream..."
          className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-blue-500/50"
        />
      </div>

      {/* Activity Timeline */}
      <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No recent activity matches your filter query.
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="relative flex items-start gap-4 pl-9 group">
              {/* Node Icon */}
              <div className="absolute left-2 top-1 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border border-slate-700 group-hover:border-blue-500 transition-colors">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              </div>

              <div className="flex-1 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5 transition group-hover:border-slate-700/80 group-hover:bg-slate-900/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.actor}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {item.actorRole}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">{item.timestamp}</span>
                </div>

                <p className="mt-1.5 text-xs text-slate-300">
                  Executed <code className="font-mono text-blue-300">{item.action}</code> on{" "}
                  <span className="font-medium text-white">{item.target}</span>
                </p>

                <div className="mt-2.5 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold ring-1 ring-inset ${getBadgeStyle(item.category)}`}>
                    {item.category.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
