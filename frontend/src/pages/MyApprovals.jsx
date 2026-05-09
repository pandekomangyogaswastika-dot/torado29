/** MyApprovals — Phase 11F: mobile-first cards + inline quick approve/reject. */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Inbox, RefreshCw, ShoppingCart, Package, Sliders, Wallet, ExternalLink,
  ClipboardCheck, Sparkles, AlertTriangle, ShoppingBag,
  Check, X, MessageSquare, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api, { unwrap } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import StatusPill from "@/components/shared/StatusPill";
import { fmtRp, fmtRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TABS = [
  { key: "all",               label: "Semua",            icon: Inbox },
  { key: "purchase_request",  label: "PR",  icon: ClipboardCheck },
  { key: "purchase_order",    label: "PO",  icon: ShoppingCart },
  { key: "stock_adjustment",  label: "Adj", icon: Sliders },
  { key: "employee_advance",  label: "Adv", icon: Wallet },
];

const ENTITY_ICONS = {
  purchase_request:  ClipboardCheck,
  purchase_order:    ShoppingCart,
  stock_adjustment:  Sliders,
  employee_advance:  Wallet,
  urgent_purchase:   ShoppingBag,
};

export default function MyApprovals() {
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardLogs, setGuardLogs] = useState({});
  const [actioning, setActioning] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // {item, action}
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = tab === "all" ? {} : { entity_type: tab };
      const [q, c] = await Promise.all([
        api.get("/approvals/queue", { params: { ...params, per_page: 200 } }),
        api.get("/approvals/counts"),
      ]);
      const queue = unwrap(q) || [];
      setItems(queue);
      setCounts((unwrap(c) || {}).by_entity || {});
      try {
        const lr = await api.get("/forecasting/guard/logs", { params: { days: 30, limit: 500 } });
        const logs = unwrap(lr) || [];
        const map = {};
        logs.forEach(l => { if (l.source_id) map[l.source_id] = l; });
        setGuardLogs(map);
      } catch { /* empty */ }
    } catch {
      toast.error("Gagal memuat queue");
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const totalCount = useMemo(
    () => Object.values(counts || {}).reduce((s, v) => s + (v || 0), 0),
    [counts],
  );

  async function quickAction(item, action, reason = null) {
    setActioning(`${item.entity_id}-${action}`);
    try {
      const body = {
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        action,
      };
      if (action === "reject") body.reason = reason || "-";
      else body.note = reason || "";
      await api.post("/approvals/quick-action", body);
      toast.success(action === "approve" ? `Approved — ${item.describe}` : `Rejected — ${item.describe}`);
      // Optimistic remove
      setItems((arr) => arr.filter((x) => x.entity_id !== item.entity_id));
    } catch (e) {
      toast.error(e?.response?.data?.errors?.[0]?.message || `Gagal ${action}`);
    } finally { setActioning(null); }
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="h-10 w-10 rounded-2xl grad-aurora flex items-center justify-center">
          <Inbox className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold leading-tight">My Approvals</h2>
          <p className="text-xs text-muted-foreground">
            Approve / reject langsung tanpa harus buka detail. Swipe → di mobile.
          </p>
        </div>
        <Button variant="outline" onClick={load} className="rounded-full gap-2 h-9" data-testid="my-approvals-refresh">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <StatTile label="Total" value={totalCount} accent active={tab === "all"} onClick={() => setTab("all")} dataTestId="stat-total" />
        {TABS.slice(1).map(t => (
          <StatTile key={t.key} label={t.label}
            value={counts?.[t.key] ?? 0}
            icon={t.icon}
            active={tab === t.key}
            onClick={() => setTab(t.key)}
            dataTestId={`stat-${t.key}`} />
        ))}
      </div>

      {/* List — mobile cards w/ swipe */}
      {loading ? <LoadingState rows={6} /> : (
        items.length === 0 ? (
          <EmptyState icon={Sparkles} title="Tidak ada approval menunggu"
            description="Semua dokumen yang membutuhkan aksi Anda sudah selesai. ✨" />
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {items.map((it, i) => (
                <SwipeRow
                  key={it.entity_id}
                  item={it}
                  index={i}
                  guardLog={guardLogs[it.entity_id]}
                  busy={actioning?.startsWith(it.entity_id)}
                  onApprove={() => quickAction(it, "approve")}
                  onReject={() => { setRejectModal({ item: it }); setRejectReason(""); }}
                />
              ))}
            </AnimatePresence>
          </div>
        )
      )}

      {/* Reject confirm modal */}
      <Dialog open={!!rejectModal} onOpenChange={(v) => !v && setRejectModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak {rejectModal?.item?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{rejectModal?.item?.describe}</span> — {fmtRp(rejectModal?.item?.amount || 0)}
            </p>
            <div>
              <label className="text-xs font-semibold">Alasan</label>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Mis. budget belum cukup, vendor belum diverifikasi, …"
                        rows={3} data-testid="reject-reason-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(null)}>Batal</Button>
            <Button variant="destructive"
                    onClick={async () => {
                      if (!rejectReason.trim()) { toast.error("Alasan wajib"); return; }
                      const it = rejectModal.item;
                      setRejectModal(null);
                      await quickAction(it, "reject", rejectReason.trim());
                    }}
                    data-testid="reject-confirm-btn">
              Konfirmasi Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({ label, value, accent = false, active = false, icon: Icon, onClick, dataTestId }) {
  return (
    <motion.button
      whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      data-testid={dataTestId}
      className={cn(
        "glass-card p-3 text-left transition-colors relative overflow-hidden",
        active && "ring-2 ring-aurora/60",
      )}>
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" /> : null}
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold truncate">{label}</div>
      </div>
      <div className={cn("text-xl font-bold tabular-nums mt-0.5", accent && "text-aurora")}>{value}</div>
    </motion.button>
  );
}

function SwipeRow({ item, index, guardLog, busy, onApprove, onReject }) {
  const Icon = ENTITY_ICONS[item.entity_type] || Inbox;
  const isSevere = guardLog?.severity === "severe";
  const isMild = guardLog?.severity === "mild";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, scale: 0.96 }}
      drag="x"
      dragConstraints={{ left: -120, right: 120 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (info.offset.x > 90) onApprove();
        else if (info.offset.x < -90) onReject();
      }}
      transition={{ delay: Math.min(index * 0.025, 0.4), duration: 0.18 }}
      className={cn(
        "glass-card p-3 lg:p-4 cursor-grab active:cursor-grabbing",
        isSevere && "ring-2 ring-red-500/40",
        isMild && "ring-2 ring-amber-500/40",
        busy && "opacity-60",
      )}>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-2xl bg-aurora/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-aurora" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={item.link} className="font-mono text-xs px-2 py-0.5 rounded-full bg-foreground/5 truncate hover:underline"
                  data-testid={`queue-row-${item.entity_id}`}>
              {item.describe}
            </Link>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              {item.label}
            </span>
            <StatusPill status={item.status} />
            {guardLog && (
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-bold",
                isSevere ? "bg-red-500/20 text-red-700 dark:text-red-300" : "bg-amber-500/20 text-amber-700 dark:text-amber-300",
              )}
                title={guardLog.message}
              >
                <AlertTriangle className="h-3 w-3" />
                forecast {guardLog.severity}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {item.tier_label && <span>tier <b className="text-foreground">{item.tier_label}</b></span>}
            <span>menunggu <b className="text-foreground">{item.step_label}</b></span>
            <span>• {fmtRelative(item.submitted_at || item.created_at)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.amount_label || "Amount"}</div>
          <div className="text-sm lg:text-base font-bold tabular-nums">{fmtRp(item.amount || 0)}</div>
        </div>
      </div>
      {/* Action buttons row — always visible (no need to hover) */}
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="default" disabled={busy}
                onClick={(e) => { e.stopPropagation(); onApprove(); }}
                className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
                data-testid={`quick-approve-${item.entity_id}`}>
          <Check className="h-4 w-4" /> Approve
        </Button>
        <Button size="sm" variant="outline" disabled={busy}
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                className="flex-1 gap-1 border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 min-h-[44px]"
                data-testid={`quick-reject-${item.entity_id}`}>
          <X className="h-4 w-4" /> Reject
        </Button>
        <Link to={item.link} className="shrink-0">
          <Button size="sm" variant="ghost" className="gap-1 min-h-[44px]">
            Detail <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
      {/* Mobile hint */}
      <p className="md:hidden text-[10px] text-muted-foreground mt-2 text-center italic">
        💡 Swipe kanan = approve, kiri = reject
      </p>
    </motion.div>
  );
}
