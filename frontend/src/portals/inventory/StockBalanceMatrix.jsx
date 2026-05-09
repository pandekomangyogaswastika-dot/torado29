/** Phase 9C — Stock Balance Matrix view (item × outlet pivot).
 *
 * - Heatmap coloring: red=below par, amber=zero, emerald=above par, gray=no par
 * - Cell click → modal with last 30 movements for that (item, outlet)
 * - Toggleable from StockBalance page
 */
import { useEffect, useMemo, useState } from "react";
import { Search, Layers, Eye, X, AlertTriangle, ArrowUpRight } from "lucide-react";
import api, { unwrap } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import { fmtRp, fmtNumber } from "@/lib/format";
import { toast } from "sonner";
import { Link } from "react-router-dom";

function cellClasses(cell) {
  if (cell.negative) return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  if (cell.below_par && cell.par_level > 0) return "bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30";
  if (cell.zero) return "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/30";
  if (cell.par_level > 0 && cell.qty >= cell.par_level * 1.5) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (cell.par_level > 0) return "bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
  return "bg-foreground/5 text-foreground/60 border-border/40";
}

function CellMovementsDialog({ open, onClose, itemName, outletName, itemId, outletId }) {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !itemId || !outletId) return;
    setLoading(true);
    api.get("/inventory/movements/cell", {
      params: { item_id: itemId, outlet_id: outletId, limit: 30 },
    })
      .then(r => setMoves(unwrap(r) || []))
      .catch(() => toast.error("Gagal load movements"))
      .finally(() => setLoading(false));
  }, [open, itemId, outletId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-3xl" data-testid="matrix-cell-dialog">
        <DialogHeader>
          <DialogTitle className="text-base">
            Riwayat: {itemName} · <span className="text-muted-foreground">{outletName}</span>
          </DialogTitle>
          <DialogDescription>
            30 movement terakhir untuk kombinasi item × outlet ini.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
          {loading && <LoadingState rows={4} />}
          {!loading && moves.length === 0 && (
            <EmptyState title="Belum ada riwayat" description="Belum ada movement untuk cell ini." />
          )}
          {!loading && moves.length > 0 && (
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b border-border/50">
                <th className="px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground">Tanggal</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground">Tipe</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground text-right">Qty</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground text-right">Unit Cost</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground text-right">Value</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground">Source</th>
              </tr></thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m.id} className="border-b border-border/30 hover:bg-foreground/5">
                    <td className="px-3 py-2 text-xs">{m.movement_date || "—"}</td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 bg-foreground/10">
                        {m.movement_type || "—"}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-right tabular-nums font-semibold ${m.qty < 0 ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                      {fmtNumber(m.qty, 2)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtRp(m.unit_cost)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtRp(m.total_cost)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[180px]">
                      {m.source_doc_no || m.source_type || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StockBalanceMatrix() {
  const [matrix, setMatrix] = useState({ outlets: [], rows: [], totals: { by_outlet: {}, grand_total_value: 0 } });
  const [loading, setLoading] = useState(true);
  const [selectedOutlets, setSelectedOutlets] = useState([]); // empty = all
  const [outletList, setOutletList] = useState([]);
  const [search, setSearch] = useState("");
  const [includeZero, setIncludeZero] = useState(true);
  const [cellOpen, setCellOpen] = useState(false);
  const [cellCtx, setCellCtx] = useState(null);

  useEffect(() => {
    api.get("/master/outlets", { params: { per_page: 100 } })
      .then(r => setOutletList(unwrap(r) || []))
      .catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = { include_zero: includeZero, days_for_par: 30, par_buffer_days: 7 };
      if (selectedOutlets.length) params.outlet_ids = selectedOutlets.join(",");
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/inventory/balance-matrix", { params });
      setMatrix(unwrap(res) || { outlets: [], rows: [] });
    } catch (e) {
      toast.error("Gagal load matrix");
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [selectedOutlets, includeZero]); // eslint-disable-line

  const debouncedSearch = useMemo(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line
  useEffect(() => debouncedSearch, [debouncedSearch]);

  function toggleOutlet(id) {
    setSelectedOutlets((cur) =>
      cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
    );
  }

  function openCell(itemRow, cell) {
    setCellCtx({
      itemId: itemRow.item_id,
      itemName: itemRow.item_name,
      outletId: cell.outlet_id,
      outletName: matrix.outlets.find(o => o.id === cell.outlet_id)?.name || "Outlet",
    });
    setCellOpen(true);
  }

  // Count below par
  const belowParCount = useMemo(() => {
    let n = 0;
    matrix.rows.forEach(r => r.cells.forEach(c => {
      if (c.below_par || c.negative) n++;
    }));
    return n;
  }, [matrix.rows]);

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 flex flex-wrap gap-3 items-end" data-testid="matrix-toolbar">
        <div className="min-w-[260px]">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Outlet (multi-pilih)</Label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {outletList.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => toggleOutlet(o.id)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  selectedOutlets.includes(o.id)
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background hover:bg-foreground/5 border-border/60"
                }`}
                data-testid={`matrix-outlet-${o.id}`}
              >
                {o.name}
              </button>
            ))}
            {selectedOutlets.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedOutlets([])}
                className="text-xs px-2 py-1 text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-[220px]">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Cari Item</Label>
          <div className="relative mt-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama / kode…" className="glass-input pl-9 h-9"
              data-testid="matrix-search" />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox" checked={includeZero}
              onChange={e => setIncludeZero(e.target.checked)}
              data-testid="matrix-include-zero" />
            <span>Tampilkan item qty=0</span>
          </label>
        </div>
        {belowParCount > 0 && (
          <Link to="/inventory/low-stock"
            className="text-xs px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 inline-flex items-center gap-1.5"
            data-testid="matrix-low-link">
            <AlertTriangle className="h-3 w-3" />
            {belowParCount} cell di bawah par
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="glass-card overflow-hidden" data-testid="matrix-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background/95 backdrop-blur z-10">
              <tr className="border-b border-border/50">
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sticky left-0 bg-background/95 backdrop-blur min-w-[180px]">
                  Item
                </th>
                {matrix.outlets.map(o => (
                  <th key={o.id} className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground min-w-[100px]">
                    {o.name}
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground min-w-[100px]">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody data-testid="matrix-body">
              {loading && <tr><td colSpan={matrix.outlets.length + 2} className="p-6"><LoadingState rows={6} /></td></tr>}
              {!loading && matrix.rows.length === 0 && (
                <tr><td colSpan={matrix.outlets.length + 2}>
                  <EmptyState title="Tidak ada data" description="Coba ubah filter outlet atau pencarian." />
                </td></tr>
              )}
              {!loading && matrix.rows.map((row) => (
                <tr key={row.item_id} className="border-b border-border/30 hover:bg-foreground/3">
                  <td className="px-3 py-2 sticky left-0 bg-background/95 backdrop-blur" data-testid={`matrix-row-${row.item_id}`}>
                    <div className="font-medium text-sm">{row.item_name}</div>
                    <div className="text-[10px] text-muted-foreground">{row.item_code} · {row.unit}</div>
                  </td>
                  {row.cells.map((cell) => (
                    <td key={cell.outlet_id} className="px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => openCell(row, cell)}
                        className={`w-full inline-flex flex-col items-center gap-0.5 px-2 py-1.5 rounded border text-[11px] tabular-nums font-semibold hover:scale-[1.02] transition-transform ${cellClasses(cell)}`}
                        title={`Par: ${cell.par_level || 0} (${cell.par_source}) · klik untuk lihat riwayat`}
                        data-testid={`matrix-cell-${row.item_id}-${cell.outlet_id}`}
                      >
                        <span>{fmtNumber(cell.qty, cell.qty % 1 === 0 ? 0 : 1)}</span>
                        {cell.par_level > 0 && (
                          <span className="text-[9px] font-normal opacity-70">par {fmtNumber(cell.par_level, 0)}</span>
                        )}
                      </button>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right tabular-nums text-xs font-semibold">
                    {fmtRp(row.totals.value)}
                  </td>
                </tr>
              ))}
              {!loading && matrix.rows.length > 0 && (
                <tr className="border-t-2 border-border/60 bg-foreground/5 font-semibold">
                  <td className="px-3 py-2 sticky left-0 bg-foreground/10 backdrop-blur text-xs uppercase tracking-wide">Total</td>
                  {matrix.outlets.map(o => {
                    const t = matrix.totals.by_outlet[o.id] || {};
                    return (
                      <td key={o.id} className="px-2 py-2 text-center text-[11px] tabular-nums">
                        <div className="text-xs">{fmtNumber(t.qty || 0, 0)}</div>
                        <div className="text-[10px] text-muted-foreground">{fmtRp(t.value || 0)}</div>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right tabular-nums text-sm">
                    {fmtRp(matrix.totals.grand_total_value || 0)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-[11px] text-muted-foreground">
        <span className="font-semibold">Legend:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-rose-500/30 border border-rose-500/40" /> Di bawah par / negatif
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-amber-500/30 border border-amber-500/40" /> Qty = 0
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" /> Aman
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-foreground/15 border border-border/40" /> Tidak ada par
        </span>
      </div>

      <CellMovementsDialog
        open={cellOpen}
        onClose={(open) => { if (!open) setCellOpen(false); }}
        itemId={cellCtx?.itemId}
        itemName={cellCtx?.itemName}
        outletId={cellCtx?.outletId}
        outletName={cellCtx?.outletName}
      />
    </div>
  );
}
