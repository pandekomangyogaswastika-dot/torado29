import { useEffect, useState, useCallback } from "react";
import { ScrollText, RefreshCw, Search, Filter } from "lucide-react";

import api, { unwrap, unwrapError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import { fmtDateTime } from "@/lib/format";

const LEVELS = ["", "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];
const LEVEL_STYLES = {
  DEBUG: "bg-zinc-200 text-zinc-700",
  INFO: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  WARNING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  ERROR: "bg-red-500/15 text-red-700 dark:text-red-400",
  CRITICAL: "bg-red-700/25 text-red-800 dark:text-red-300 font-bold",
};

export default function LogsView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    level: "", request_id: "", route_contains: "", user_id: "",
  });
  const [stats, setStats] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 200 };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const [r, s] = await Promise.all([
        api.get("/admin/logs/recent", { params }),
        api.get("/admin/logs/stats"),
      ]);
      setItems(unwrap(r)?.items || []);
      setStats(unwrap(s));
    } catch (e) {
      setError(unwrapError(e));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ScrollText className="h-5 w-5" /> Recent Logs
          </h2>
          <p className="text-xs text-muted-foreground">
            Total: {stats?.total || 0} entries · By level: {Object.entries(stats?.recent_by_level || {}).map(([k, v]) => `${k}:${v}`).join(" · ") || "-"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} data-testid="logs-refresh">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="glass-card p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select className="glass-input h-9 px-2 rounded-md" value={filters.level}
                  onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                  data-testid="logs-filter-level">
            {LEVELS.map((l) => <option key={l} value={l}>{l || "All levels"}</option>)}
          </select>
        </div>
        <Input className="glass-input h-9 max-w-[260px]" placeholder="Request ID"
                value={filters.request_id} onChange={(e) => setFilters({ ...filters, request_id: e.target.value })}
                data-testid="logs-filter-rid" />
        <div className="relative max-w-[260px] flex-1">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="glass-input h-9 pl-8" placeholder="Filter route (regex)"
                  value={filters.route_contains}
                  onChange={(e) => setFilters({ ...filters, route_contains: e.target.value })}
                  data-testid="logs-filter-route" />
        </div>
        <Input className="glass-input h-9 max-w-[200px]" placeholder="User ID"
                value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })} />
        <Button size="sm" onClick={load} className="rounded-full ml-auto pill-active">Apply</Button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading && !items.length ? <LoadingState />
        : items.length === 0 ? <EmptyState title="Belum ada log" hint="Coba ubah filter atau tunggu request masuk." />
        : (
        <div className="glass-card overflow-hidden">
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 backdrop-blur bg-background/90">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border/50">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Level</th>
                  <th className="py-2 px-3">Method/Route</th>
                  <th className="py-2 px-3 text-right">Status</th>
                  <th className="py-2 px-3 text-right">ms</th>
                  <th className="py-2 px-3">Request ID</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, i) => {
                  const lvl = row.level || "INFO";
                  const code = row.status_code;
                  const codeStyle = !code ? "" : code >= 500 ? "text-red-600 font-semibold" : code >= 400 ? "text-amber-600 font-semibold" : "text-emerald-600";
                  return (
                    <>
                      <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/40 cursor-pointer"
                          onClick={() => setExpanded(expanded === i ? null : i)}>
                        <td className="py-2 px-3 font-mono text-xs whitespace-nowrap">{fmtDateTime(row.ts)}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_STYLES[lvl] || LEVEL_STYLES.INFO}`}>{lvl}</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-xs">
                          {row.method ? <><span className="text-muted-foreground">{row.method}</span> {row.route}</> : row.msg?.slice(0, 80)}
                        </td>
                        <td className={`py-2 px-3 text-right tabular-nums ${codeStyle}`}>{code || "-"}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">{row.duration_ms?.toFixed(1) || "-"}</td>
                        <td className="py-2 px-3 font-mono text-xs text-muted-foreground truncate max-w-[180px]">{row.request_id?.slice(0, 8) || "-"}</td>
                      </tr>
                      {expanded === i && (
                        <tr className="bg-muted/30">
                          <td colSpan={6} className="px-3 py-3">
                            <pre className="text-xs font-mono whitespace-pre-wrap break-all">{JSON.stringify(row, null, 2)}</pre>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
