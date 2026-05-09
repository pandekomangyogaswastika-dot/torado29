import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { Activity, ScrollText as LogIcon, Calendar as CalIcon, Archive as ArchiveIcon, Gauge } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import MetricsView from "./operations/MetricsView";
import LogsView from "./operations/LogsView";
import SchedulerView from "./operations/SchedulerView";
import ArchivalView from "./operations/ArchivalView";
import RateLimitsView from "./operations/RateLimitsView";

const SUB = [
  { path: "",            label: "Metrics",       icon: Gauge,       exact: true },
  { path: "logs",        label: "Logs",          icon: LogIcon },
  { path: "scheduler",   label: "Scheduler",     icon: CalIcon },
  { path: "archival",    label: "Archival",      icon: ArchiveIcon },
  { path: "rate-limits", label: "Rate Limits",   icon: Activity },
];

export default function Operations() {
  return (
    <div className="space-y-5">
      <SubNav />
      <Routes>
        <Route index element={<MetricsView />} />
        <Route path="logs" element={<LogsView />} />
        <Route path="scheduler" element={<SchedulerView />} />
        <Route path="archival" element={<ArchivalView />} />
        <Route path="rate-limits" element={<RateLimitsView />} />
        <Route path="*" element={<Navigate to="/admin/operations" replace />} />
      </Routes>
    </div>
  );
}

function SubNav() {
  const location = useLocation();
  const base = "/admin/operations";
  const current = location.pathname.replace(base, "").replace(/^\//, "");
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
      {SUB.map((r) => {
        const isActive = r.exact ? current === r.path : current === r.path || current.startsWith(`${r.path}/`);
        const Icon = r.icon;
        return (
          <Link
            key={r.path || "home"}
            to={`${base}/${r.path}`}
            className={cn(
              "relative px-3.5 py-2 rounded-full text-sm flex items-center gap-2 whitespace-nowrap transition-colors",
              isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
            data-testid={`ops-tab-${r.path || "metrics"}`}
          >
            {isActive && (
              <motion.div
                layoutId="ops-subnav-pill"
                className="absolute inset-0 grad-aurora-soft rounded-full"
                transition={{ type: "spring", duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="h-3.5 w-3.5" />
              {r.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
