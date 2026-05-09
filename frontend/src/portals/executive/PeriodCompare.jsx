/** Phase 11D — Period Comparison matrix page. */
import { useEffect, useMemo, useState } from "react";
import { GitCompareArrows, RefreshCw } from "lucide-react";
import api, { unwrap } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingState from "@/components/shared/LoadingState";
import { fmtRp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const METRICS = [
  { v: "revenue",       l: "Revenue" },
  { v: "cogs",          l: "COGS" },
  { v: "gross_profit",  l: "Gross Profit" },
  { v: "opex",          l: "OPEX" },
  { v: "service_charge", l: "Service Charge" },
  { v: "net_profit",    l: "Net Profit" },
];

const PERIODS = [
  { v: "mtd",        l: "MTD" },
  { v: "lmtd",       l: "LMTD" },
  { v: "qtd",        l: "QTD" },
  { v: "ytd",        l: "YTD" },
  { v: "yoy",        l: "YoY" },
  { v: "last_month", l: "Last Month" },
];

export default function PeriodCompare() {
  const [selectedMetrics, setSelectedMetrics] = useState([
    "revenue", "cogs", "gross_profit", "opex", "net_profit",
  ]);
  const [selectedPeriods, setSelectedPeriods] = useState([
    "mtd", "lmtd", "yoy",
  ]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!selectedMetrics.length || !selectedPeriods.length) {
      toast.error("Pilih minimal 1 metric dan 1 periode");
      return;
    }
    setLoading(true);
    try {
      const r = await api.get("/executive/period-compare", {
        params: {
          metrics: selectedMetrics.join(","),
          period_kinds: selectedPeriods.join(","),
        },
      });
      setData(unwrap(r));
    } catch (e) {
      toast.error("Gagal load comparison");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selectedMetrics.join(","), selectedPeriods.join(",")]);

  const periods = data?.periods || [];

  function toggleMetric(v) {
    setSelectedMetrics((m) => m.includes(v) ? m.filter(x => x !== v) : [...m, v]);
  }
  function togglePeriod(v) {
    setSelectedPeriods((p) => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl grad-aurora text-white flex items-center justify-center">
              <GitCompareArrows className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-bold">Period Comparison</h2>
              <p className="text-xs text-muted-foreground">
                Bandingkan multi-metric across MTD/LMTD/YoY/QTD/YTD
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold mb-2">Metrics</div>
            <div className="flex flex-wrap gap-2">
              {METRICS.map((m) => (
                <label key={m.v} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-muted/30 cursor-pointer text-xs">
                  <Checkbox checked={selectedMetrics.includes(m.v)} onCheckedChange={() => toggleMetric(m.v)} />
                  {m.l}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold mb-2">Periods</div>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <label key={p.v} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-muted/30 cursor-pointer text-xs">
                  <Checkbox checked={selectedPeriods.includes(p.v)} onCheckedChange={() => togglePeriod(p.v)} />
                  {p.l}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading || !data ? <LoadingState message="Loading…" /> : (
        <div className="glass-card p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="py-2 sticky left-0 bg-background">Metric</th>
                {periods.map((p) => (
                  <th key={p.kind} className="text-right px-3">{p.label}</th>
                ))}
                {periods.length >= 2 && (
                  <th className="text-right px-3">
                    Δ ({periods[0].kind} vs {periods[1].kind})
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {(data.metrics || []).map((row) => {
                const v0 = row.values[periods[0]?.kind];
                const v1 = row.values[periods[1]?.kind];
                const delta = (v0 != null && v1 != null) ? v0 - v1 : null;
                const pct = (v1 && v1 !== 0) ? ((v0 - v1) / Math.abs(v1) * 100).toFixed(1) : null;
                return (
                  <tr key={row.metric} className="border-b last:border-b-0">
                    <td className="py-2 font-medium sticky left-0 bg-background">
                      {METRICS.find(m => m.v === row.metric)?.l || row.metric}
                    </td>
                    {periods.map((p) => (
                      <td key={p.kind} className="text-right font-mono px-3">
                        {fmtRp(row.values[p.kind])}
                      </td>
                    ))}
                    {periods.length >= 2 && delta != null && (
                      <td className={cn("text-right font-mono px-3",
                        delta >= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {delta >= 0 ? "+" : ""}{fmtRp(delta)}
                        {pct != null && <span className="text-[10px] ml-1">({pct > 0 ? "+" : ""}{pct}%)</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
