"use client";

import Link from "next/link";

export interface MetricData {
  organizations: { total: number; active: number; growth: string };
  projects: { total: number; active: number; growth: string };
  users: { total: number; active: number; growth: string };
  apiKeys: { total: number; active: number; requests: number; growth: string };
}

interface MetricCardsProps {
  data: MetricData;
}

export function MetricCards({ data }: MetricCardsProps) {
  const cards = [
    {
      title: "Organizations",
      value: data.organizations.total,
      sub: `${data.organizations.active} Active Workspaces`,
      trend: data.organizations.growth,
      trendUp: true,
      href: "/settings/organization",
      color: "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30",
      icon: (
        <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5s1.5 0 1.5 1.5v1.5s0 1.5-1.5 1.5H9m0-4.5v4.5m0-4.5h6" />
        </svg>
      ),
    },
    {
      title: "Client Projects",
      value: data.projects.total,
      sub: `${data.projects.active} Active Websites`,
      trend: data.projects.growth,
      trendUp: true,
      href: "/settings/projects",
      color: "from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/30",
      icon: (
        <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12.75M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      title: "Team Members",
      value: data.users.total,
      sub: `${data.users.active} Active Accounts`,
      trend: data.users.growth,
      trendUp: true,
      href: "/settings/organization",
      color: "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30",
      icon: (
        <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      title: "API Keys",
      value: data.apiKeys.total,
      sub: `${data.apiKeys.requests.toLocaleString()} total reqs`,
      trend: data.apiKeys.growth,
      trendUp: true,
      href: "/settings/api-keys",
      color: "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30",
      icon: (
        <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:shadow-2xl hover:shadow-blue-500/5"
        >
          {/* Subtle Top Accent Line */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`} />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.title}</span>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br border ${card.color}`}>
              {card.icon}
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tabular-nums text-white group-hover:text-blue-300 transition-colors">
              {card.value}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
              {card.trend}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3">
            <span className="text-xs text-slate-400">{card.sub}</span>
            <span className="text-xs font-medium text-blue-400 opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-0.5">
              View details
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
