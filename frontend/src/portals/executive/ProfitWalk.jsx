/** Phase 11D — Profit Walk waterfall page. */
import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp, ChevronDown, RefreshCw, Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, ReferenceLine,
} from "recharts";
import api, { unwrap } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingState from "@/components/shared/LoadingState";
import KpiCard from "@/components/shared/KpiCard";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fmtRp, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PERIODS = [
  { v: "mtd",       l: "MTD" },
  { v: "lmtd",      l: "Last Month (LMTD)" },
  { v: "qtd",       l: "QTD" },
  { v: "ytd",       l: "YTD" },
  { v: "yoy",       l: "YoY" },
  { v: "last_month", l: "Last Month (Full)" },
];

const BAR_COLOR = {
  positive: "#10B981",
  negative: "#EF4444",
  subtotal: "#5B5FE3",
  total: "#0EA5E9",
};

export default function ProfitWalk() {
  const [period, setPeriod] = useState("mtd");
  const [compare, setCompare] = useState("lmtd");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get("/executive/profit-walk", {
        params: { period_kind: period, compare_kind: compare },
      });
      setData(unwrap(r));
    } catch (e) {
      toast.error("Gagal load profit walk");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [period, compare]);

  const chartData = useMemo(() => {
    if (!data?.stages) return [];
    return data.stages.map((s, i) => ({
      ...s,
      idx: i,
      // Recharts needs a positive bar size; |value|
      bar: Math.abs(s.value),
      negDelta: (s.delta_pct || 0) < 0,
    }));
  }, [data]);

  if (loading || !data) return <LoadingState message="Loading profit walk…" />;

  const summary = data.summary || {};

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl grad-aurora text-white flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-bold">Profit Walk</h2>
              <p className="text-xs text-muted-foreground">
                Revenue → COGS → GP → OPEX → Service → Net Profit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">vs</span>
            <Select value={compare} onValueChange={setCompare}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Period <span className="font-mono font-semibold text-foreground">{data.period?.label}</span>
          {data.compare?.label && <> vs <span className="font-mono font-semibold text-foreground">{data.compare.label}</span></>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <KpiCard label="Revenue" value={fmtRp(summary.revenue || 0)} icon={TrendingUp} color="aurora-1" />
        <KpiCard label="Gross Profit" value={fmtRp(summary.gross_profit || 0)} icon={TrendingUp} color="aurora-2"
                 hint={summary.gp_margin_pct != null ? `${summary.gp_margin_pct}% margin` : null} />
        <KpiCard label="Net Profit" value={fmtRp(summary.net_profit || 0)} icon={TrendingUp}
                 color={(summary.net_profit || 0) >= 0 ? "success" : "danger"}
                 hint={summary.net_margin_pct != null ? `${summary.net_margin_pct}% margin` : null} />
        <KpiCard label="Δ Net vs Compare"
                 value={summary.net_delta_pct != null ? `${summary.net_delta_pct > 0 ? "+" : ""}${summary.net_delta_pct}%` : "—"}
                 icon={Sparkles}
                 color={(summary.net_delta_pct || 0) >= 0 ? "success" : "danger"}
                 hint={`Compare: ${fmtRp(summary.compare_net_profit || 0)}`} />
      </div>

      {/* Waterfall chart */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">Waterfall</h3>
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 16, left: 8, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" interval={0} height={70} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip
                formatter={(_v, _n, ctx) => [fmtRp(ctx.payload.value), ctx.payload.label]}
                labelFormatter={() => ""}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const s = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-2 shadow-lg text-xs">
                      <div className="font-semibold">{s.label}</div>
                      <div className="font-mono">{fmtRp(s.value)}</div>
                      {s.delta_pct != null && (
                        <div className={cn("font-mono", s.delta_pct >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {s.delta_pct >= 0 ? "+" : ""}{s.delta_pct}% vs compare
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke="#999" />
              <Bar dataKey="bar" radius={[4, 4, 0, 0]}>
                {chartData.map((s, i) => (
                  <Cell key={i} fill={BAR_COLOR[s.kind] || "#888"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stage detail table */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">Detail per Stage</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="py-2">Stage</th>
                <th className="text-right">Period</th>
                <th className="text-right">Compare</th>
                <th className="text-right">Δ</th>
                <th className="text-right">Δ %</th>
                <th className="text-right">Running</th>
              </tr>
            </thead>
            <tbody>
              {data.stages.map((s, i) => {
                const delta = (s.value || 0) - (s.compare || 0);
                return (
                  <tr key={i} className={cn(
                    "border-b last:border-b-0",
                    (s.kind === "subtotal" || s.kind === "total") && "bg-muted/30 font-semibold",
                  )}>
                    <td className="py-2">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{s.kind}</Badge>
                        {s.label}
                      </span>
                    </td>
                    <td className="text-right font-mono">{fmtRp(s.value)}</td>
                    <td className="text-right font-mono text-muted-foreground">{fmtRp(s.compare)}</td>
                    <td className={cn("text-right font-mono", delta >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {delta >= 0 ? "+" : ""}{fmtRp(delta)}
                    </td>
                    <td className={cn("text-right font-mono text-xs", (s.delta_pct || 0) >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {s.delta_pct != null ? `${s.delta_pct > 0 ? "+" : ""}${s.delta_pct}%` : "—"}
                    </td>
                    <td className="text-right font-mono text-xs text-muted-foreground">{fmtRp(s.running)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top drivers */}
      {data.top_drivers?.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-3">Top Drivers</h3>
          <ul className="space-y-2">
            {data.top_drivers.map((d, i) => (
              <li key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-b-0">
                <span className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-muted text-xs flex items-center justify-center">{i + 1}</span>
                  {d.label}
                </span>
                <span className="flex items-center gap-3">
                  <span className={cn("font-mono", d.delta >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {d.delta >= 0 ? "+" : ""}{fmtRp(d.delta)}
                  </span>
                  {d.delta_pct != null && (
                    <span className={cn("font-mono text-xs", d.delta_pct >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      ({d.delta_pct > 0 ? "+" : ""}{d.delta_pct}%)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
