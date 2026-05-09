/** Payment Request List — daftar PR dengan filters dan status tracking. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, Plus, Filter, CheckCircle2, Clock, XCircle, DollarSign } from "lucide-react";
import api, { unwrap } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingState from "@/components/shared/LoadingState";
import EmptyState from "@/components/shared/EmptyState";
import { fmtRp, fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PaymentRequestList() {
  const navigate = useNavigate();
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    period_week: "",
    date_from: "",
    date_to: "",
  });

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/finance/payment-requests", { params: filters });
      setPrs(unwrap(res) || []);
    } catch (e) {
      toast.error("Gagal load Payment Requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filters]);

  const stats = {
    draft: prs.filter(p => p.status === "draft").length,
    submitted: prs.filter(p => p.status === "submitted").length,
    approved: prs.filter(p => p.status === "approved").length,
    paid: prs.filter(p => p.status === "paid").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Payment Request</h2>
        <Button
          onClick={() => navigate("/finance/payment-requests/new")}
          className="rounded-full gap-2"
          data-testid="pr-create"
        >
          <Plus className="h-4 w-4" /> Buat PR Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Draft" value={stats.draft} icon={Clock} accent="slate" />
        <StatCard label="Menunggu Approval" value={stats.submitted} icon={Clock} accent="amber" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Paid" value={stats.paid} icon={DollarSign} accent="sky" />
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Filter</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-[11px] uppercase text-muted-foreground">Status</Label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="glass-input rounded-lg w-full px-3 h-9 mt-1 text-sm"
              data-testid="pr-filter-status"
            >
              <option value="">-- Semua --</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <Label className="text-[11px] uppercase text-muted-foreground">Period Week (YYYY-WW)</Label>
            <Input
              type="text"
              placeholder="mis: 2026-20"
              value={filters.period_week}
              onChange={(e) => setFilters({ ...filters, period_week: e.target.value })}
              className="glass-input h-9 mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase text-muted-foreground">Dari Tanggal</Label>
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="glass-input h-9 mt-1"
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase text-muted-foreground">Sampai Tanggal</Label>
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="glass-input h-9 mt-1"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {loading && <LoadingState rows={5} />}
      {!loading && prs.length === 0 && (
        <EmptyState
          icon={Receipt}
          title="Belum ada Payment Request"
          description="Klik 'Buat PR Baru' untuk membuat payment request pertama."
        />
      )}
      {!loading && prs.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border/50">
                  <Th>PR No</Th>
                  <Th>Tanggal</Th>
                  <Th>Periode</Th>
                  <Th>Jumlah Item</Th>
                  <Th className="text-right">Total Amount</Th>
                  <Th>Requested By</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {prs.map((pr) => (
                  <tr
                    key={pr.id}
                    className="border-b border-border/30 hover:bg-foreground/5 cursor-pointer"
                    onClick={() => navigate(`/finance/payment-requests/${pr.id}`)}
                    data-testid={`pr-row-${pr.doc_no}`}
                  >
                    <td className="px-5 py-3 font-mono font-medium">{pr.doc_no}</td>
                    <td className="px-5 py-3">{fmtDate(pr.request_date)}</td>
                    <td className="px-5 py-3 font-mono text-xs">{pr.period_week}</td>
                    <td className="px-5 py-3 text-center">{pr.items?.length || 0}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">
                      {fmtRp(pr.total_amount)}
                    </td>
                    <td className="px-5 py-3 text-xs">{pr.requested_by_name || pr.requested_by}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={pr.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/finance/payment-requests/${pr.id}`);
                        }}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${className}`}
    >
      {children}
    </th>
  );
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 text-${accent}-700 dark:text-${accent}-400`} />
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums text-${accent}-700 dark:text-${accent}-400`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    draft: { label: "Draft", color: "slate", Icon: Clock },
    submitted: { label: "Menunggu Approval", color: "amber", Icon: Clock },
    approved: { label: "Approved", color: "emerald", Icon: CheckCircle2 },
    rejected: { label: "Rejected", color: "red", Icon: XCircle },
    paid: { label: "Paid", color: "sky", Icon: DollarSign },
  };

  const c = config[status] || config.draft;
  const Icon = c.Icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        `bg-${c.color}-100 dark:bg-${c.color}-900/30 text-${c.color}-700 dark:text-${c.color}-400`
      )}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}
