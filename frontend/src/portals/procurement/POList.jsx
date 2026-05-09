/** PO List + filter. (7E mobile-card polish) */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileCheck, Eye } from "lucide-react";
import api, { unwrap } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import StatusPill from "@/components/shared/StatusPill";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import DataList from "@/components/shared/DataList";
import { fmtRp, fmtDate } from "@/lib/format";
import { toast } from "sonner";

const STATUS_TABS = [
  { key: "",          label: "Semua" },
  { key: "draft",     label: "Draft" },
  { key: "sent",      label: "Sent" },
  { key: "partial",   label: "Partial" },
  { key: "received",  label: "Received" },
  { key: "cancelled", label: "Cancelled" },
];

export default function POList() {
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, per_page: 20 });

  useEffect(() => {
    api.get("/master/vendors", { params: { per_page: 200 } })
      .then(r => setVendors(unwrap(r) || [])).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = { page, per_page: 20 };
      if (status) params.status = status;
      if (vendorId) params.vendor_id = vendorId;
      const res = await api.get("/procurement/pos", { params });
      setItems(unwrap(res) || []);
      setMeta(res.data?.meta || {});
    } catch (e) {
      toast.error("Gagal load PO");
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [page, status, vendorId]); // eslint-disable-line

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / (meta.per_page || 20)));

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-end">
          <div className="sm:min-w-[220px] flex-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold" htmlFor="po-vendor">Vendor</Label>
            <select id="po-vendor" value={vendorId} onChange={e => { setVendorId(e.target.value); setPage(1); }}
              className="glass-input rounded-lg w-full px-3 h-10 text-sm mt-1" data-testid="po-filter-vendor">
              <option value="">Semua</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <Link to="/procurement/po/new" className="sm:ml-auto">
            <Button className="rounded-full pill-active gap-2 h-10 px-5 w-full sm:w-auto" data-testid="po-new">
              <Plus className="h-4 w-4" /> PO Baru
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Filter status">
        {STATUS_TABS.map(t => (
          <button key={t.key || "all"}
            role="tab" aria-selected={status === t.key}
            onClick={() => { setStatus(t.key); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors touch-target ${
              status === t.key ? "pill-active" : "hover:bg-foreground/5 text-muted-foreground"
            }`}
            data-testid={`po-tab-${t.key || "all"}`}
          >{t.label}</button>
        ))}
      </div>

      <div className="glass-card">
        <DataList
          columns={[
            {
              key: "doc_no", label: "Doc No", primary: true,
              render: po => <span className="font-mono text-xs">{po.doc_no || po.id.slice(0, 8)}</span>,
            },
            { key: "order_date", label: "Tanggal", render: po => fmtDate(po.order_date) },
            { key: "vendor", label: "Vendor", render: po => vendors.find(x => x.id === po.vendor_id)?.name || po.vendor_id },
            { key: "lines", label: "Lines", numeric: true, render: po => po.lines?.length || 0 },
            {
              key: "grand_total", label: "Grand Total", numeric: true,
              render: po => <span className="font-semibold">{fmtRp(po.grand_total || 0)}</span>,
            },
            { key: "status", label: "Status", render: po => <StatusPill status={po.status} /> },
          ]}
          rows={items}
          loading={loading}
          loadingNode={<div className="p-6"><LoadingState rows={5} /></div>}
          empty={<EmptyState icon={FileCheck} title="Belum ada PO" description="Buat PO dari PR yang sudah approved atau langsung."
            action={<Link to="/procurement/po/new"><Button className="pill-active rounded-full">Buat PO</Button></Link>} />}
          rowAction={(po) => (
            <Link to={`/procurement/po/${po.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" data-testid={`po-view-${po.id}`} aria-label={`Lihat detail PO ${po.doc_no || po.id}`} onClick={(e) => e.stopPropagation()}>
              <Eye className="h-3.5 w-3.5" /> Detail
            </Link>
          )}
          rowTestIdPrefix="po"
        />
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total: {meta.total}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-full glass-input disabled:opacity-50" aria-label="Halaman sebelumnya">Prev</button>
              <span className="px-2 py-1">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-full glass-input disabled:opacity-50" aria-label="Halaman berikutnya">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
