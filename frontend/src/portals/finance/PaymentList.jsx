/** Payment Request (PAY) list page. */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Banknote, Plus, Search } from "lucide-react";
import api, { unwrapWithMeta } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingState from "@/components/shared/LoadingState";
import EmptyState from "@/components/shared/EmptyState";
import StatusPill from "@/components/shared/StatusPill";
import { fmtRp, fmtDate } from "@/lib/format";
import { toast } from "sonner";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "awaiting_approval", label: "Awaiting" },
  { key: "submitted", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
  { key: "rejected", label: "Rejected" },
  { key: "cancelled", label: "Cancelled" },
];

export default function PaymentList() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [kpi, setKpi] = useState(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const params = { page: 1, per_page: 50 };
      if (status !== "all") params.status = status;
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/finance/payments", { params });
      const { data, meta } = unwrapWithMeta(res);
      setItems(data || []);
      setMeta(meta || { page: 1, per_page: 50, total: 0 });
    } catch (e) {
      toast.error("Gagal memuat daftar PAY");
    } finally { setLoading(false); }
  }

  async function loadKpi() {
    try {
      const res = await api.get("/finance/payments/kpi");
      setKpi(res.data.data);
    } catch {}
  }

  useEffect(() => { load(); }, [status]);
  useEffect(() => { loadKpi(); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search]);

  return (
    <div className="space-y-4">
      {kpi && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiTile label="Draft" value={kpi.draft} tone="neutral" />
          <KpiTile label="Awaiting approval" value={kpi.awaiting_approval} tone="amber" />
          <KpiTile label="Approved (ready to pay)" value={kpi.approved} tone="sky" />
          <KpiTile label={`Paid ${kpi.period}`} value={`${kpi.paid_this_month.count} · ${fmtRp(kpi.paid_this_month.amount)}`} tone="emerald" />
        </div>
      )}

      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1" role="tablist">
          {STATUS_TABS.map(t => (
            <button key={t.key}
              role="tab" aria-selected={status === t.key}
              data-testid={`pay-tab-${t.key}`}
              className={`px-3 py-1.5 text-xs rounded-full transition ${status === t.key ? "bg-foreground text-background" : "hover:bg-foreground/10"}`}
              onClick={() => setStatus(t.key)}>{t.label}</button>
          ))}
        </div>
        <div className="relative ml-auto max-w-xs w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari doc_no / payee / invoice..." value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="glass-input pl-9 h-9" data-testid="pay-search" />
        </div>
        <Button onClick={() => navigate("/finance/payments/new")}
          className="rounded-full gap-2 h-10 bg-foreground text-background hover:bg-foreground/90"
          data-testid="pay-new-btn"><Plus className="h-4 w-4" />New Payment</Button>
      </div>

      {loading && <LoadingState rows={6} />}
      {!loading && items.length === 0 && (
        <EmptyState icon={Banknote} title="Belum ada Payment Request"
          description="Klik 'New Payment' untuk bayar vendor/pegawai/lainnya."
          actionLabel="Buat Payment" onAction={() => navigate("/finance/payments/new")} />
      )}
      {!loading && items.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border/50">
                  <Th>Doc No</Th>
                  <Th>Date</Th>
                  <Th>Payee</Th>
                  <Th>Description</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id} className="border-b border-border/30 hover:bg-foreground/5 cursor-pointer"
                      onClick={() => navigate(`/finance/payments/${p.id}`)}
                      data-testid={`pay-row-${p.doc_no}`}>
                    <td className="px-4 py-3 font-mono text-xs">{p.doc_no}</td>
                    <td className="px-4 py-3">{fmtDate(p.request_date)}</td>
                    <td className="px-4 py-3">
                      <div>{p.payee_name || p.payee_text || "-"}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{p.payee_type}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[280px] truncate">{p.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{fmtRp(p.amount)}</td>
                    <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/finance/payments/${p.id}`} className="text-xs text-primary hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-border/40 text-[11px] text-muted-foreground">
            Total: {meta.total} PAY
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${className}`}>{children}</th>;
}
function KpiTile({ label, value, tone = "neutral" }) {
  const cls = {
    neutral: "", amber: "text-amber-700 dark:text-amber-400",
    sky: "text-sky-700 dark:text-sky-400", emerald: "text-emerald-700 dark:text-emerald-400",
  }[tone] || "";
  return (
    <div className="glass-card p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold tabular-nums mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
