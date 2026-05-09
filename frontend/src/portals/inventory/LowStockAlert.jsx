/** Phase 9C — Low Stock Alert + Quick PR.
 *
 * Lists items where qty < par_level across the user's outlets.
 * - Bulk select → "Buat PR (X items)" button passes prefill payload to /procurement/pr/new
 *   via base64-encoded URL param. PRForm picks it up and seeds line items.
 * - Filter by outlet, severity, search.
 * - Click row → highlight; sortable.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowDown, ArrowUp, Search, ShoppingCart,
  CheckSquare, Square, Package, RefreshCw, Filter,
} from "lucide-react";
import api, { unwrap } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import { fmtRp, fmtNumber } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

function severityClasses(sev) {
  if (sev === "critical") return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  if (sev === "low") return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  return "bg-muted text-muted-foreground border-border/50";
}

function encodePrefill(items) {
  const payload = {
    source: "low_stock",
    lines: items.map(it => ({
      item_id: it.item_id,
      item_name: it.item_name,
      qty: it.suggested_reorder || 1,
      unit: it.unit,
      unit_cost: it.last_unit_cost || 0,
      outlet_id: it.outlet_id,
    })),
    // Use first selected outlet as the PR outlet (PRs can group by outlet later)
    outlet_id: items[0]?.outlet_id,
    vendor_id: items[0]?.last_vendor_id || null,
    note: `Otomatis dari Low Stock — ${items.length} item perlu replenish.`,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export default function LowStockAlert() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [data, setData] = useState({ outlets: [], items: [], total_below: 0 });
  const [loading, setLoading] = useState(true);
  const [outletId, setOutletId] = useState("");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [sortKey, setSortKey] = useState("severity");
  const [sortDir, setSortDir] = useState("asc");

  async function load() {
    setLoading(true);
    try {
      const params = { include_zero: true, include_negative: true, days_for_par: 30 };
      if (outletId) params.outlet_ids = outletId;
      const res = await api.get("/inventory/low-stock", { params });
      setData(unwrap(res) || { outlets: [], items: [], total_below: 0 });
      setSelected(new Set());
    } catch (e) {
      toast.error("Gagal load low-stock data");
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [outletId]); // eslint-disable-line

  const filtered = useMemo(() => {
    let list = (data.items || []).slice();
    if (severity !== "all") list = list.filter(x => x.severity === severity);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(x =>
        (x.item_name || "").toLowerCase().includes(s) ||
        (x.item_code || "").toLowerCase().includes(s) ||
        (x.outlet_name || "").toLowerCase().includes(s),
      );
    }
    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "severity") {
        cmp = (a.severity === "critical" ? 0 : 1) - (b.severity === "critical" ? 0 : 1);
        if (cmp === 0) cmp = (b.deficit || 0) - (a.deficit || 0);
      } else if (sortKey === "deficit") {
        cmp = (a.deficit || 0) - (b.deficit || 0);
      } else if (sortKey === "qty") {
        cmp = (a.qty || 0) - (b.qty || 0);
      } else if (sortKey === "item_name") {
        cmp = (a.item_name || "").localeCompare(b.item_name || "");
      } else if (sortKey === "outlet_name") {
        cmp = (a.outlet_name || "").localeCompare(b.outlet_name || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [data.items, severity, search, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key); setSortDir("asc");
    }
  }
  function rowKey(it) { return `${it.item_id}::${it.outlet_id}`; }
  function toggleSelect(it) {
    const k = rowKey(it);
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  }
  function toggleSelectAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(rowKey)));
    }
  }
  const selectedItems = useMemo(() =>
    filtered.filter(it => selected.has(rowKey(it))),
  [filtered, selected]);

  function createPRFromSelected() {
    if (selectedItems.length === 0) {
      toast.error("Pilih minimal 1 item.");
      return;
    }
    // Group by outlet — show warning if mixed
    const outlets = new Set(selectedItems.map(it => it.outlet_id));
    if (outlets.size > 1) {
      toast.warning(
        `Anda memilih ${outlets.size} outlet — PR akan dibuat untuk outlet pertama saja. ` +
        "Buat PR terpisah untuk outlet lain.",
        { duration: 5000 }
      );
    }
    if (!can("procurement.pr.create")) {
      toast.error("Anda tidak punya izin membuat PR.");
      return;
    }
    const encoded = encodePrefill(selectedItems);
    navigate(`/procurement/pr/new?prefill=${encodeURIComponent(encoded)}`);
  }

  const counts = useMemo(() => {
    const total = data.total_below || 0;
    const critical = (data.items || []).filter(x => x.severity === "critical").length;
    const low = total - critical;
    return { total, critical, low };
  }, [data.items, data.total_below]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold inline-flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Low Stock Alert
          </h2>
          <p className="text-xs text-muted-foreground">
            Item di bawah par level — buat PR cepat untuk replenish
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} data-testid="low-refresh">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile label="Total di bawah par" value={counts.total} colorClass="text-rose-600 dark:text-rose-400" testid="low-tile-total" />
        <SummaryTile label="Critical (qty=0/negatif)" value={counts.critical} colorClass="text-rose-600 dark:text-rose-400" testid="low-tile-critical" />
        <SummaryTile label="Low (di bawah par)" value={counts.low} colorClass="text-amber-600 dark:text-amber-400" testid="low-tile-low" />
        <SummaryTile label="Item dipilih" value={selected.size} colorClass="text-foreground" testid="low-tile-selected" />
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-end" data-testid="low-toolbar">
        <div className="min-w-[200px]">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Outlet</Label>
          <select value={outletId} onChange={e => setOutletId(e.target.value)}
            className="glass-input rounded-lg w-full px-3 h-9 text-sm mt-1" data-testid="low-outlet">
            <option value="">Semua outlet (dalam scope)</option>
            {(data.outlets || []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="min-w-[200px]">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Severity</Label>
          <div className="flex gap-1.5 mt-1">
            {[
              { v: "all", l: "Semua" },
              { v: "critical", l: "Critical" },
              { v: "low", l: "Low" },
            ].map(s => (
              <button
                key={s.v}
                type="button"
                onClick={() => setSeverity(s.v)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  severity === s.v
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background hover:bg-foreground/5 border-border/60"
                }`}
                data-testid={`low-sev-${s.v}`}
              >
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Cari</Label>
          <div className="relative mt-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari item / outlet…" className="glass-input pl-9 h-9"
              data-testid="low-search" />
          </div>
        </div>
        <Button onClick={createPRFromSelected}
          disabled={selectedItems.length === 0}
          className="pill-active gap-1.5"
          data-testid="low-create-pr">
          <ShoppingCart className="h-4 w-4" />
          Buat PR ({selectedItems.length})
        </Button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden" data-testid="low-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50">
              <tr>
                <Th className="w-10">
                  <button onClick={toggleSelectAll} type="button" data-testid="low-select-all">
                    {selected.size === filtered.length && filtered.length > 0
                      ? <CheckSquare className="h-4 w-4" />
                      : <Square className="h-4 w-4" />}
                  </button>
                </Th>
                <Th sortable onClick={() => toggleSort("severity")} active={sortKey === "severity"} dir={sortDir}>
                  Severity
                </Th>
                <Th sortable onClick={() => toggleSort("item_name")} active={sortKey === "item_name"} dir={sortDir}>
                  Item
                </Th>
                <Th sortable onClick={() => toggleSort("outlet_name")} active={sortKey === "outlet_name"} dir={sortDir}>
                  Outlet
                </Th>
                <Th sortable onClick={() => toggleSort("qty")} active={sortKey === "qty"} dir={sortDir} className="text-right">
                  Qty
                </Th>
                <Th className="text-right">Par</Th>
                <Th sortable onClick={() => toggleSort("deficit")} active={sortKey === "deficit"} dir={sortDir} className="text-right">
                  Defisit
                </Th>
                <Th className="text-right">Sugested Reorder</Th>
                <Th>Last Vendor / Price</Th>
              </tr>
            </thead>
            <tbody data-testid="low-table-body">
              {loading && <tr><td colSpan={9} className="p-6"><LoadingState rows={6} /></td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={9}>
                  <EmptyState
                    title="Stok aman 🎉"
                    description="Tidak ada item yang di bawah par level."
                  />
                </td></tr>
              )}
              {!loading && filtered.map((it) => {
                const k = rowKey(it);
                const isSel = selected.has(k);
                return (
                  <tr key={k}
                    className={`border-b border-border/30 hover:bg-foreground/3 ${isSel ? "bg-foreground/5" : ""}`}
                    data-testid={`low-row-${it.item_id}-${it.outlet_id}`}>
                    <td className="px-3 py-2">
                      <button onClick={() => toggleSelect(it)} type="button"
                        data-testid={`low-select-${it.item_id}-${it.outlet_id}`}>
                        {isSel ? <CheckSquare className="h-4 w-4 text-foreground" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border ${severityClasses(it.severity)}`}>
                        {it.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-sm flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        {it.item_name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{it.item_code} · {it.unit}</div>
                    </td>
                    <td className="px-3 py-2 text-sm">{it.outlet_name}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-semibold ${it.qty < 0 ? "text-rose-700 dark:text-rose-300" : ""}`}>
                      {fmtNumber(it.qty, 1)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {fmtNumber(it.par_level, 1)}
                      <div className="text-[9px] uppercase tracking-wide opacity-70">{it.par_source}</div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-rose-700 dark:text-rose-300 font-semibold">
                      {fmtNumber(it.deficit, 1)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className="font-medium">{it.suggested_reorder || 0}</span>
                      <span className="text-[10px] text-muted-foreground"> {it.unit}</span>
                    </td>
                    <td className="px-3 py-2">
                      {it.last_vendor_name ? (
                        <div className="text-xs">
                          <div className="font-medium">{it.last_vendor_name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {fmtRp(it.last_unit_cost)}/{it.unit}
                            {it.last_purchase_date && <> · {it.last_purchase_date}</>}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Belum ada riwayat</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "", sortable, onClick, active, dir }) {
  return (
    <th
      onClick={onClick}
      className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ${sortable ? "cursor-pointer select-none hover:text-foreground" : ""} ${className}`}
    >
      <span className="inline-flex items-center gap-0.5">
        {children}
        {sortable && active && (
          dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        )}
      </span>
    </th>
  );
}

function SummaryTile({ label, value, colorClass, testid }) {
  return (
    <div className="glass-card p-3" data-testid={testid}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums mt-1 ${colorClass}`}>{value}</div>
    </div>
  );
}
