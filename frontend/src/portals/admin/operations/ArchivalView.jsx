import { useEffect, useState, useCallback } from "react";
import { Archive as ArchiveIcon, RefreshCw, Trash2, AlertCircle } from "lucide-react";

import api, { unwrap, unwrapError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";
import { toast } from "sonner";
import { fmtNumber, fmtDateTime } from "@/lib/format";

export default function ArchivalView() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get("/admin/archival/stats");
      setStats(unwrap(r) || {});
    } catch (e) {
      setError(unwrapError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function run(dryRun) {
    if (!dryRun && !window.confirm("Yakin menjalankan archival? Data lebih lama dari retention akan dipindah ke koleksi *_archive lalu dihapus dari source.")) return;
    setRunning(true);
    try {
      const r = await api.post("/admin/archival/run", { dry_run: dryRun, batch_size: 1000 });
      const result = unwrap(r);
      setLastResult(result);
      const total = Object.values(result.summary || {}).reduce((s, v) => s + (v.archived || v.would_archive || 0), 0);
      toast.success(dryRun ? "Dry-run selesai" : `Archival selesai: ${total} dokumen`, {
        description: `Dijalankan: ${fmtDateTime(result.finished_at)}`,
      });
      await load();
    } catch (e) {
      toast.error("Archival gagal", { description: unwrapError(e) });
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ArchiveIcon className="h-5 w-5" /> Data Archival
          </h2>
          <p className="text-xs text-muted-foreground">Per-collection retention windows. Konfigurasi via env (RETENTION_*_DAYS).</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => run(true)} disabled={running} data-testid="archival-dry-run">
            <ArchiveIcon className="h-3.5 w-3.5 mr-2" /> Dry Run
          </Button>
          <Button size="sm" onClick={() => run(false)} disabled={running} className="rounded-full" data-testid="archival-run">
            <Trash2 className="h-3.5 w-3.5 mr-2" /> {running ? "Running…" : "Run Archival"}
          </Button>
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="glass-card p-4 flex items-start gap-3 border-l-4 border-amber-500">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p><strong>Best practice:</strong> Run “Dry Run” dulu untuk lihat berapa dokumen yang akan dipindah, baru jalankan archival real. Job ini juga otomatis dijadwalkan setiap Minggu jam 02:00 WIB.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border/50">
              <th className="py-3 px-4">Collection</th>
              <th className="py-3 px-4 text-right">Retention (days)</th>
              <th className="py-3 px-4">Cutoff</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-right">Eligible</th>
              <th className="py-3 px-4 text-right">Already Archived</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats).map(([coll, info]) => (
              <tr key={coll} className="border-b border-border/30 last:border-0 hover:bg-muted/40">
                <td className="py-2 px-4 font-mono text-xs">{coll}</td>
                <td className="py-2 px-4 text-right tabular-nums">{info.retention_days}</td>
                <td className="py-2 px-4 font-mono text-xs whitespace-nowrap">{fmtDateTime(info.cutoff)}</td>
                <td className="py-2 px-4 text-right tabular-nums">{fmtNumber(info.total)}</td>
                <td className="py-2 px-4 text-right tabular-nums font-semibold">
                  <span className={info.eligible_for_archive > 0 ? "text-amber-700 dark:text-amber-400" : ""}>
                    {fmtNumber(info.eligible_for_archive)}
                  </span>
                </td>
                <td className="py-2 px-4 text-right tabular-nums text-muted-foreground">{fmtNumber(info.already_archived)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lastResult && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-2">Last Run Result</h3>
          <pre className="text-xs font-mono bg-muted/40 p-3 rounded overflow-auto max-h-[280px]">{JSON.stringify(lastResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
