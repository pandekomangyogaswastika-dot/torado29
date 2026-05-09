/**
 * Payroll List — Sprint G Enhanced
 * Tabs: Siklus Payroll | Salary Master
 * Features: BPJS breakdown, PPh21, payslip PDF, salary Excel import
 */
import { useEffect, useState, useRef } from "react";
import {
  Plus, CalendarClock, ArrowUpCircle, FileText, Download,
  Upload, Users, ChevronDown, ChevronUp, Wallet, Shield,
  RefreshCw, AlertCircle, CheckCircle2, FileSpreadsheet, Edit3,
  Save, X, Info
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import StatusPill from "@/components/shared/StatusPill";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import { fmtRp, fmtDate } from "@/lib/format";
import { validateNPWP } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import api, { unwrap, unwrapError } from "@/lib/api";

const PTKP_OPTIONS = [
  "TK/0", "TK/1", "TK/2", "TK/3",
  "K/0", "K/1", "K/2", "K/3",
  "K/I/0", "K/I/1", "K/I/2", "K/I/3",
];

const STD_COMPONENTS = [
  { code: "TUNJ_JABATAN", name: "Tunjangan Jabatan" },
  { code: "TUNJ_MAKAN", name: "Tunjangan Makan" },
  { code: "TUNJ_TRANSPORT", name: "Tunjangan Transport" },
  { code: "TUNJ_KESEHATAN", name: "Tunjangan Kesehatan" },
];

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtPct(v) {
  return `${(v * 100).toFixed(2)}%`;
}

// ── Payslip PDF generator ──────────────────────────────────────────────────────
function generatePayslipPDF(cycle, empData, companyName, outlets) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a5" });
  const W = 148, ml = 12, mr = W - 12;
  let y = 15;
  const line = () => { doc.setLineWidth(0.2); doc.line(ml, y, mr, y); y += 3; };
  const gap = (n = 4) => { y += n; };
  const txt = (text, x, bold = false, size = 9) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.text(String(text), x, y);
  };
  const row = (label, value, color = false) => {
    txt(label, ml);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(fmtRp(value), mr, y, { align: "right" });
    if (color && value > 0) { doc.setTextColor(200, 50, 50); doc.text(fmtRp(value), mr, y, { align: "right" }); doc.setTextColor(0); }
    y += 5;
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(companyName || "PT. Torado Group", ml, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Slip Gaji / Payslip", ml, y);
  doc.text(`Periode: ${cycle.period || "-"}`, mr, y, { align: "right" });
  y += 3;
  line();

  // Employee info
  txt("Karyawan", ml, true, 8);
  doc.setFontSize(8); doc.text(empData.name || "-", ml + 25, y); y += 4;
  txt("NPWP", ml, false, 8);
  doc.setFontSize(8); doc.text(empData.npwp || "-", ml + 25, y); y += 4;
  txt("Status PTKP", ml, false, 8);
  doc.setFontSize(8); doc.text(empData.ptkp_status || "TK/0", ml + 25, y); y += 4;
  const outletName = outlets?.find(o => o.id === empData.outlet_id)?.name || "-";
  txt("Outlet", ml, false, 8);
  doc.setFontSize(8); doc.text(outletName, ml + 25, y); y += 3;
  line();

  // Pendapatan
  txt("PENDAPATAN", ml, true, 9); y += 5;
  row("Gaji Pokok", empData.basic);
  if (empData.allowances_total > 0) {
    (empData.allowances || []).forEach(a => { if (a.amount > 0) row(a.name || "Tunjangan", a.amount); });
  }
  if (empData.service_share > 0) row("Service Share", empData.service_share);
  if (empData.incentive_share > 0) row("Incentive", empData.incentive_share);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("Total Pendapatan", ml, y);
  doc.text(fmtRp(empData.gross), mr, y, { align: "right" }); y += 3;
  line();

  // Potongan
  txt("POTONGAN", ml, true, 9); y += 5;
  if (empData.bpjs_employee > 0) {
    row("BPJS TK (JHT+JP)", (empData.bpjs_detail?.jht_employee || 0) + (empData.bpjs_detail?.jp_employee || 0));
    row("BPJS Kesehatan", empData.bpjs_detail?.jkes_employee || 0);
  }
  if (empData.pph21 > 0) row("PPh 21", empData.pph21);
  if (empData.advance_repayment > 0) row("Cicilan Kasbon", empData.advance_repayment);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("Total Potongan", ml, y);
  doc.text(fmtRp(empData.deductions + (empData.advance_repayment || 0)), mr, y, { align: "right" }); y += 3;
  line();

  // Take home
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("TAKE HOME PAY", ml, y);
  doc.text(fmtRp(empData.take_home), mr, y, { align: "right" }); y += 3;
  line();

  // Footer
  gap(6);
  txt(`Doc: ${cycle.doc_no || "-"} | Digenerate: ${new Date().toLocaleDateString("id-ID")}`, ml, false, 7);
  y += 4;
  txt("Tanda Tangan HRD", ml, false, 8);
  doc.line(ml + 30, y + 2, ml + 65, y + 2);

  doc.save(`Payslip_${empData.name?.replace(/ /g, "_")}_${cycle.period}.pdf`);
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PayrollList() {
  const { user } = useAuth();
  const [tab, setTab] = useState("cycles");
  const [items, setItems] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [detailId, setDetailId] = useState(null);

  // Salary master states
  const [salaryMasters, setSalaryMasters] = useState([]);
  const [smLoading, setSmLoading] = useState(false);
  const [editSm, setEditSm] = useState(null); // employee data being edited

  // Excel import state
  const [importOpen, setImportOpen] = useState(false);

  const canApprove = (user?.permissions || []).includes("hr.advance.approve")
    || (user?.permissions || []).includes("*");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/hr/payroll", { params: { per_page: 30 } });
      setItems(unwrap(r) || []);
    } finally { setLoading(false); }
  };

  const loadSalaryMasters = async () => {
    setSmLoading(true);
    try {
      const r = await api.get("/hr/salary-master", { params: { per_page: 200 } });
      setSalaryMasters(unwrap(r) || []);
    } catch (e) {
      toast.error(unwrapError(e));
    } finally { setSmLoading(false); }
  };

  useEffect(() => {
    api.get("/master/outlets", { params: { per_page: 100 } }).then(r => setOutlets(unwrap(r) || []));
    load();
  }, []);

  useEffect(() => {
    if (tab === "salary") loadSalaryMasters();
  }, [tab]);

  return (
    <div className="space-y-4" data-testid="hr-payroll-page">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="cycles" className="gap-2">
              <CalendarClock className="h-4 w-4" /> Siklus Payroll
            </TabsTrigger>
            <TabsTrigger value="salary" className="gap-2">
              <Users className="h-4 w-4" /> Salary Master
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {tab === "cycles" && canApprove && (
              <Button onClick={() => setShowForm(true)} className="rounded-full" data-testid="hr-payroll-create">
                <Plus className="h-4 w-4 mr-2" /> Generate Payroll
              </Button>
            )}
            {tab === "salary" && canApprove && (
              <Button variant="outline" onClick={() => setImportOpen(true)} className="rounded-full" data-testid="salary-import-btn">
                <Upload className="h-4 w-4 mr-2" /> Import Excel/CSV
              </Button>
            )}
          </div>
        </div>

        {/* ─── Cycles Tab ─── */}
        <TabsContent value="cycles" className="mt-4">
          <div className="text-sm text-muted-foreground mb-3">
            Payroll cycle bulanan — gaji + service share + incentive − kasbon − BPJS − PPh21.
          </div>
          {loading ? (
            <LoadingState rows={5} />
          ) : items.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Belum ada payroll cycle"
              description="Generate payroll bulanan untuk membuat draft, lalu post ke jurnal." />
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3">Doc No</th>
                    <th className="text-left px-4 py-3">Period</th>
                    <th className="text-left px-4 py-3">Outlet</th>
                    <th className="text-right px-4 py-3">Gross</th>
                    <th className="text-right px-4 py-3">BPJS</th>
                    <th className="text-right px-4 py-3">PPh21</th>
                    <th className="text-right px-4 py-3">Take Home</th>
                    <th className="text-center px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id} className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                        onClick={() => setDetailId(it.id)}
                        data-testid={`hr-payroll-row-${it.id}`}>
                      <td className="px-4 py-3 font-mono text-xs">{it.doc_no}</td>
                      <td className="px-4 py-3 font-mono">{it.period}</td>
                      <td className="px-4 py-3 text-sm">{outlets.find(o => o.id === it.outlet_id)?.name || "Group-wide"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm">{fmtRp(it.total_gross)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs text-amber-600">{it.total_bpjs_employee ? fmtRp(it.total_bpjs_employee) : "-"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs text-red-500">{it.total_pph21 ? fmtRp(it.total_pph21) : "-"}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{fmtRp(it.total_take_home)}</td>
                      <td className="px-4 py-3 text-center"><StatusPill status={it.status} /></td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {canApprove && it.status !== "posted" && (
                          <Button size="sm" variant="default" className="rounded-full"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await api.post(`/hr/payroll/${it.id}/post`);
                                      toast.success("Payroll di-post");
                                      await load();
                                    } catch (e) { toast.error(unwrapError(e)); }
                                  }}
                                  data-testid={`hr-payroll-post-${it.id}`}>
                            <ArrowUpCircle className="h-3.5 w-3.5 mr-1" /> Post
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ─── Salary Master Tab ─── */}
        <TabsContent value="salary" className="mt-4">
          <div className="text-sm text-muted-foreground mb-3">
            Konfigurasi komponen gaji per karyawan: gaji pokok, tunjangan, BPJS, dan status PTKP untuk PPh21.
          </div>
          {smLoading ? (
            <LoadingState rows={5} />
          ) : salaryMasters.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada salary master"
              description="Klik karyawan untuk mengatur gaji pokok, tunjangan, dan BPJS." />
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3">Karyawan</th>
                    <th className="text-left px-4 py-3">Outlet</th>
                    <th className="text-right px-4 py-3">Gaji Pokok</th>
                    <th className="text-right px-4 py-3">Tunjangan</th>
                    <th className="text-right px-4 py-3">BPJS (EE)</th>
                    <th className="text-right px-4 py-3">PPh21/bln</th>
                    <th className="text-center px-4 py-3">PTKP</th>
                    <th className="text-center px-4 py-3">BPJS</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryMasters.map(sm => (
                    <tr key={sm.employee_id} className="border-b border-white/5 hover:bg-white/5"
                        data-testid={`salary-master-row-${sm.employee_id}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{sm.employee_name}</div>
                        <div className="text-xs text-muted-foreground">{sm.employee_code}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{outlets.find(o => o.id === sm.outlet_id)?.name || "-"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmtRp(sm.basic_salary)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm">{fmtRp(sm.allowances_total)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs text-amber-600">{fmtRp(sm.bpjs_employee)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-xs text-red-500">{fmtRp(sm.pph21_monthly)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="text-xs">{sm.ptkp_status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sm.bpjs_enrolled
                          ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          : <X className="h-4 w-4 text-muted-foreground mx-auto" />}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canApprove && (
                          <Button size="sm" variant="ghost" onClick={() => setEditSm(sm)}
                                  data-testid={`edit-sm-${sm.employee_id}`}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PayrollFormDialog open={showForm} onOpenChange={setShowForm}
        outlets={outlets} onCreated={async () => { setShowForm(false); await load(); }} />
      <PayrollDetailDialog pid={detailId} open={!!detailId}
        onOpenChange={(v) => !v && setDetailId(null)}
        outlets={outlets} canApprove={canApprove}
        onPosted={async () => { setDetailId(null); await load(); }} />
      {editSm && (
        <SalaryMasterDialog smData={editSm} outlets={outlets}
          onClose={() => setEditSm(null)}
          onSaved={() => { setEditSm(null); loadSalaryMasters(); }} />
      )}
      <SalaryImportDialog open={importOpen} onOpenChange={setImportOpen}
        onImported={() => { setImportOpen(false); loadSalaryMasters(); }} />
    </div>
  );
}

// ── Payroll Form Dialog ─────────────────────────────────────────────────────────
function PayrollFormDialog({ open, onOpenChange, outlets, onCreated }) {
  const [form, setForm] = useState({ period: currentPeriod(), outlet_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post("/hr/payroll", {
        period: form.period,
        outlet_id: form.outlet_id || undefined,
      });
      toast.success("Payroll cycle dibuat (draft) — BPJS & PPh21 dihitung otomatis");
      await onCreated();
    } catch (e) {
      toast.error(unwrapError(e));
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="hr-payroll-form-dialog">
        <DialogHeader>
          <DialogTitle>Generate Payroll Cycle</DialogTitle>
          <DialogDescription>Auto-konsolidasi gaji + tunjangan + service + incentive − kasbon − BPJS − PPh21.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              BPJS (JHT 2%+JP 1%+JKes 1%) dan PPh21 (jika diaktifkan) akan dihitung otomatis dari Salary Master.
            </AlertDescription>
          </Alert>
          <div className="space-y-1">
            <Label>Period *</Label>
            <Input type="month" value={form.period}
                    onChange={(e) => setForm(f => ({ ...f, period: e.target.value }))}
                    data-testid="hr-payroll-period" />
          </div>
          <div className="space-y-1">
            <Label>Outlet</Label>
            <Select value={form.outlet_id || "all"} onValueChange={(v) => setForm(f => ({ ...f, outlet_id: v === "all" ? "" : v }))}>
              <SelectTrigger data-testid="hr-payroll-outlet"><SelectValue placeholder="— Group-wide —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">— Group-wide —</SelectItem>
                {outlets.map(o => (<SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="rounded-full"
                  data-testid="hr-payroll-submit">
            {submitting ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Generating…</> : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Payroll Detail Dialog ───────────────────────────────────────────────────────
function PayrollDetailDialog({ pid, open, onOpenChange, outlets, canApprove, onPosted }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [expandBpjs, setExpandBpjs] = useState(false);

  useEffect(() => {
    if (!pid) { setData(null); return; }
    api.get(`/hr/payroll/${pid}`).then(r => setData(unwrap(r))).catch(() => {});
  }, [pid]);

  const handlePost = async () => {
    setBusy(true);
    try {
      await api.post(`/hr/payroll/${pid}/post`);
      toast.success("Payroll posted (advance schedule auto-paid)");
      await onPosted();
    } catch (e) { toast.error(unwrapError(e)); } finally { setBusy(false); }
  };

  const downloadPayslip = (empData) => {
    if (!data) return;
    generatePayslipPDF(data, empData, undefined, outlets);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" data-testid="hr-payroll-detail">
        <DialogHeader>
          <DialogTitle>Payroll Detail</DialogTitle>
          {data && (
            <DialogDescription>
              {data.doc_no} · Period <span className="font-mono">{data.period}</span> · <StatusPill status={data.status} />
              {" "} · {outlets.find(o => o.id === data.outlet_id)?.name || "Group-wide"}
            </DialogDescription>
          )}
        </DialogHeader>
        {!data ? (<LoadingState rows={5} />) : (
          <div className="space-y-4">
            {/* Summary tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Tile label="Total Gross" value={fmtRp(data.total_gross)} />
              <Tile label="BPJS Employee" value={fmtRp(data.total_bpjs_employee)} accent="amber" />
              <Tile label="PPh 21" value={fmtRp(data.total_pph21)} accent="red" />
              <Tile label="Total Take Home" value={fmtRp(data.total_take_home)} highlight />
            </div>

            {/* BPJS employer summary */}
            <button
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setExpandBpjs(b => !b)}
            >
              <Shield className="h-3.5 w-3.5" />
              BPJS Employer Contribution: {fmtRp(data.total_bpjs_employer)}
              {expandBpjs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {expandBpjs && (
              <Alert>
                <AlertDescription className="text-xs">
                  JKK 0.54% + JKM 0.30% + JHT 3.70% + JP 2.00% + JKes 4.00% = total <strong>{fmtRp(data.total_bpjs_employer)}</strong> beban perusahaan (tidak dipotong dari karyawan).
                </AlertDescription>
              </Alert>
            )}

            {/* Per-employee table */}
            <div className="glass-card overflow-hidden">
              <table className="w-full text-xs">
                <thead className="uppercase text-muted-foreground border-b border-white/10">
                  <tr>
                    <th className="text-left px-3 py-2">Karyawan</th>
                    <th className="text-right px-3 py-2">Pokok</th>
                    <th className="text-right px-3 py-2">Tunj.</th>
                    <th className="text-right px-3 py-2">SC+Inc</th>
                    <th className="text-right px-3 py-2">Gross</th>
                    <th className="text-right px-3 py-2">BPJS</th>
                    <th className="text-right px-3 py-2">PPh21</th>
                    <th className="text-right px-3 py-2">Kasbon</th>
                    <th className="text-right px-3 py-2 font-bold">Take Home</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {(data.employees || []).map((e, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-3 py-2 font-medium">{e.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtRp(e.basic)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtRp(e.allowances_total)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtRp((e.service_share || 0) + (e.incentive_share || 0))}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">{fmtRp(e.gross)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-amber-600">{fmtRp(e.bpjs_employee)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-red-500">{fmtRp(e.pph21)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtRp(e.advance_repayment)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold">{fmtRp(e.take_home)}</td>
                      <td className="px-3 py-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-6 w-6"
                                      onClick={() => downloadPayslip(e)}
                                      data-testid={`payslip-btn-${idx}`}>
                                <FileText className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download Payslip PDF</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Tutup</Button>
          {canApprove && data && data.status !== "posted" && (
            <Button onClick={handlePost} disabled={busy} className="rounded-full"
                    data-testid="hr-payroll-detail-post">
              {busy ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Posting…</> : <><ArrowUpCircle className="h-4 w-4 mr-2" />Post Payroll</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Salary Master Edit Dialog ───────────────────────────────────────────────────
function SalaryMasterDialog({ smData, outlets, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Load full salary master for employee
    api.get(`/hr/salary-master/${smData.employee_id}`)
      .then(r => {
        const d = unwrap(r);
        // Ensure standard components exist
        const existing = d?.components || [];
        const merged = ["TUNJ_JABATAN", "TUNJ_MAKAN", "TUNJ_TRANSPORT", "TUNJ_KESEHATAN"].map(code => {
          const found = existing.find(c => c.code === code);
          const std = STD_COMPONENTS.find(s => s.code === code);
          return { code, name: (found?.name || std?.name || code), amount: found?.amount ?? 0 };
        });
        setForm({
          basic_salary: d?.basic_salary ?? smData.basic_salary ?? 0,
          components: merged,
          bpjs_enrolled: d?.bpjs_enrolled ?? true,
          ptkp_status: d?.ptkp_status ?? "TK/0",
          npwp: d?.npwp ?? "",
          notes: d?.notes ?? "",
        });
      })
      .catch(() => {
        setForm({
          basic_salary: smData.basic_salary ?? 0,
          components: STD_COMPONENTS.map(s => ({ ...s })),
          bpjs_enrolled: smData.bpjs_enrolled ?? true,
          ptkp_status: smData.ptkp_status ?? "TK/0",
          npwp: smData.npwp ?? "",
          notes: "",
        });
      });
  }, [smData.employee_id]);

  const totalAllowances = (form?.components || []).reduce((s, c) => s + parseFloat(c.amount || 0), 0);
  const totalFixed = parseFloat(form?.basic_salary || 0) + totalAllowances;

  const handleSave = async () => {
    setBusy(true);
    try {
      await api.put(`/hr/salary-master/${smData.employee_id}`, form);
      toast.success(`Salary master ${smData.employee_name} disimpan`);
      onSaved();
    } catch (e) { toast.error(unwrapError(e)); } finally { setBusy(false); }
  };

  const updateComp = (code, val) => {
    setForm(f => ({
      ...f,
      components: f.components.map(c => c.code === code ? { ...c, amount: parseFloat(val) || 0 } : c),
    }));
  };

  if (!form) return null;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg" data-testid="salary-master-dialog">
        <DialogHeader>
          <DialogTitle>Salary Master — {smData.employee_name}</DialogTitle>
          <DialogDescription>
            {outlets.find(o => o.id === smData.outlet_id)?.name || ""} · Posisi: {smData.position || "-"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {/* Basic Salary */}
          <div className="space-y-1">
            <Label>Gaji Pokok (Rp) *</Label>
            <Input type="number" value={form.basic_salary}
                   onChange={e => setForm(f => ({ ...f, basic_salary: parseFloat(e.target.value) || 0 }))}
                   data-testid="basic-salary-input" />
          </div>

          {/* Allowances */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tunjangan Tetap</Label>
            <div className="grid grid-cols-2 gap-2">
              {form.components.map(comp => (
                <div key={comp.code} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{comp.name}</Label>
                  <Input type="number" value={comp.amount}
                         onChange={e => updateComp(comp.code, e.target.value)}
                         className="h-8 text-sm"
                         data-testid={`comp-${comp.code}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between text-sm border rounded-md px-3 py-2 bg-muted/30">
            <span className="text-muted-foreground">Total Gaji Tetap</span>
            <span className="font-bold">{fmtRp(totalFixed)}</span>
          </div>

          {/* BPJS + PTKP */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status PTKP (PPh21)</Label>
              <Select value={form.ptkp_status} onValueChange={v => setForm(f => ({ ...f, ptkp_status: v }))}>
                <SelectTrigger data-testid="ptkp-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PTKP_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>NPWP</Label>
              <Input value={form.npwp}
                     onChange={e => setForm(f => ({ ...f, npwp: e.target.value }))}
                     placeholder="00.000.000.0-000.000"
                     data-testid="npwp-input" />
              {form.npwp && (() => {
                const v = validateNPWP(form.npwp);
                return !v.valid
                  ? <p className="text-xs text-destructive">{v.message}</p>
                  : <p className="text-xs text-green-600">✓ Format NPWP valid</p>;
              })()}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={form.bpjs_enrolled}
              onCheckedChange={v => setForm(f => ({ ...f, bpjs_enrolled: v }))}
              data-testid="bpjs-switch"
            />
            <div>
              <div className="text-sm font-medium">Terdaftar BPJS</div>
              <div className="text-xs text-muted-foreground">
                JHT 2% + JP 1% + JKes 1% = ~{fmtRp(Math.round(totalFixed * 0.04 * 100) / 100)}/bln (karyawan)
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Catatan</Label>
            <Input value={form.notes}
                   onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                   placeholder="Opsional..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={busy} className="rounded-full"
                  data-testid="save-salary-master">
            {busy ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Salary Import Dialog ─────────────────────────────────────────────────────────
function SalaryImportDialog({ open, onOpenChange, onImported }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef();

  const handleUpload = async () => {
    if (!file) { toast.error("Pilih file terlebih dahulu"); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post("/hr/salary-master/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const d = unwrap(r);
      setResult(d);
      toast.success(`Import selesai: ${d.imported} baru, ${d.updated} diperbarui`);
      if (d.imported + d.updated > 0) onImported();
    } catch (e) { toast.error(unwrapError(e)); } finally { setBusy(false); }
  };

  const downloadTemplate = () => {
    const headers = ["employee_code", "full_name", "basic_salary", "tunjangan_jabatan", "tunjangan_makan", "tunjangan_transport", "tunjangan_kesehatan", "bpjs_enrolled", "ptkp_status", "npwp"];
    const sample = ["ALT-001", "Nama Karyawan", "4000000", "500000", "300000", "300000", "0", "true", "TK/0", ""];
    const csv = [headers.join(","), sample.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "salary_master_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setFile(null); setResult(null); } onOpenChange(v); }}>
      <DialogContent className="max-w-md" data-testid="salary-import-dialog">
        <DialogHeader>
          <DialogTitle>Import Salary Master</DialogTitle>
          <DialogDescription>Upload file Excel (.xlsx) atau CSV dengan data gaji karyawan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Kolom: employee_code, basic_salary, tunjangan_jabatan, tunjangan_makan, tunjangan_transport, bpjs_enrolled (true/false), ptkp_status, npwp
            </AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Download Template CSV
          </Button>
          <div className="space-y-2">
            <Label>File Excel / CSV</Label>
            <Input type="file" accept=".xlsx,.csv" ref={fileRef}
                   onChange={e => { setFile(e.target.files[0]); setResult(null); }}
                   data-testid="salary-import-file" />
          </div>
          {result && (
            <div className="rounded-md border p-3 space-y-1 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {result.imported} baru · {result.updated} diperbarui
              </div>
              {result.errors?.length > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="text-xs font-medium text-destructive">{result.errors.length} error:</div>
                  {result.errors.slice(0, 5).map((e, i) => (
                    <div key={i} className="text-xs text-destructive flex gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />{e}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { setFile(null); setResult(null); onOpenChange(false); }}>Tutup</Button>
          <Button onClick={handleUpload} disabled={busy || !file} className="rounded-full"
                  data-testid="salary-import-submit">
            {busy ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Tile({ label, value, highlight, accent }) {
  const accentClass = accent === "amber" ? "text-amber-600" : accent === "red" ? "text-red-500" : "";
  return (
    <div className={highlight ? "glass-card p-3 ring-1 ring-aurora" : "glass-card-hover p-3"}>
      <div className="text-[11px] uppercase text-muted-foreground mb-1">{label}</div>
      <div className={`text-base font-bold tabular-nums ${accentClass}`}>{value}</div>
    </div>
  );
}
