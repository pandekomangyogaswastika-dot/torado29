/** Budget Management — Sprint B + Sprint G (Excel import) */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Target, Plus, Edit2, Trash2, Loader2, X, Search, ChevronRight,
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

const EMPTY_FORM = { name: "", period: new Date().toISOString().slice(0, 7), notes: "", lines: [] };
const CATEGORIES = [
  { code: "REV", name: "Revenue" },
  { code: "COGS", name: "HPP / COGS" },
  { code: "OPEX", name: "Operating Expenses" },
  { code: "PAYROLL", name: "Payroll" },
  { code: "MKTG", name: "Marketing" },
  { code: "DEP", name: "Depreciation" },
  { code: "TAX", name: "Tax Expense" },
];

export default function BudgetManagement() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // budget id or null
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // COA search for line items
  const [coaSearch, setCoaSearch] = useState("");
  const [coaResults, setCoaResults] = useState([]);
  const [coaSearching, setCoaSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterPeriod) params.period = filterPeriod;
      const res = await api.get("/budget/budgets", { params });
      if (res.data.success) setBudgets(res.data.data?.items || []);
    } catch { toast.error("Gagal memuat budgets"); }
    finally { setLoading(false); }
  }, [filterPeriod]);

  useEffect(() => { load(); }, [load]);

  async function searchCOA(q) {
    if (!q || q.length < 2) { setCoaResults([]); return; }
    setCoaSearching(true);
    try {
      const res = await api.get("/master/chart-of-accounts", { params: { q, limit: 10 } });
      setCoaResults(res.data?.data?.items || []);
    } catch {} finally { setCoaSearching(false); }
  }

  function addLine(coa) {
    if (form.lines.some(l => l.coa_id === coa.id)) {
      toast.warning("COA sudah ada di daftar");
      return;
    }
    setForm(f => ({
      ...f,
      lines: [...f.lines, {
        coa_id: coa.id,
        coa_code: coa.code,
        coa_name: coa.name,
        category: "OPEX",
        amount: 0,
      }],
    }));
    setCoaSearch("");
    setCoaResults([]);
  }

  function removeLine(idx) {
    setForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
  }

  function updateLine(idx, key, value) {
    setForm(f => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, [key]: value } : l) }));
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(budget) {
    setEditing(budget.id);
    setForm({
      name: budget.name,
      period: budget.period,
      notes: budget.notes || "",
      lines: (budget.lines || []).map(l => ({ ...l })),
    });
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (!form.period) { toast.error("Periode wajib diisi"); return; }
    if (form.lines.length === 0) { toast.error("Minimal 1 baris budget"); return; }
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/budget/budgets/${editing}`, form);
        toast.success("Budget diperbarui");
      } else {
        await api.post("/budget/budgets", form);
        toast.success("Budget dibuat");
      }
      setFormOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0]?.message || "Gagal menyimpan budget");
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Hapus budget ini?")) return;
    try {
      await api.delete(`/budget/budgets/${id}`);
      toast.success("Budget dihapus");
      load();
    } catch { toast.error("Gagal menghapus"); }
  }

  const totalBudgeted = (b) => (b.lines || []).reduce((s, l) => s + parseFloat(l.amount || 0), 0);

  return (
    <div className="space-y-6" data-testid="budget-management">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="h-6 w-6" /> Manajemen Budget
          </h2>
          <p className="text-muted-foreground text-sm">Kelola budget per COA dan periode</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} data-testid="import-budget-btn">
            <Upload className="h-4 w-4 mr-2" /> Import Excel
          </Button>
          <Button onClick={openCreate} data-testid="create-budget-btn">
            <Plus className="h-4 w-4 mr-2" /> Buat Budget
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>Filter Periode</Label>
              <Input type="month" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
                data-testid="filter-period" />
            </div>
            {filterPeriod && (
              <Button variant="outline" size="sm" onClick={() => setFilterPeriod("")}>
                <X className="h-4 w-4 mr-1" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget List */}
      <Card data-testid="budget-list-card">
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="mx-auto h-8 w-8 mb-2" />
              <p>Belum ada budget.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                Buat Budget Pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Jumlah Baris</TableHead>
                  <TableHead className="text-right">Total Budget</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map(b => (
                  <TableRow key={b.id} data-testid={`budget-row-${b.id}`}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell><Badge variant="outline">{b.period}</Badge></TableCell>
                    <TableCell>{(b.lines || []).length} baris</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalBudgeted(b))}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)} data-testid="edit-budget-btn">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(b.id)}
                          data-testid="delete-budget-btn">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BudgetImportDialog open={importOpen} onOpenChange={setImportOpen}
        onImported={() => { setImportOpen(false); load(); }} />

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="budget-form-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Budget" : "Buat Budget Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>Nama Budget</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={`Budget ${form.period}`} data-testid="budget-name-input" />
              </div>
              <div className="space-y-2">
                <Label>Periode *</Label>
                <Input type="month" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                  data-testid="budget-period-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Catatan..." rows={2} />
            </div>

            {/* COA Search & Lines */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Baris Budget (COA)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari COA (kode atau nama)..."
                    value={coaSearch}
                    onChange={e => { setCoaSearch(e.target.value); searchCOA(e.target.value); }}
                    className="pl-9"
                    data-testid="coa-search-input"
                  />
                </div>
              </div>
              {coaResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-40 overflow-y-auto shadow-sm">
                  {coaResults.map(c => (
                    <button key={c.id} onClick={() => addLine(c)}
                      className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                      <span>{c.name}</span>
                      <ChevronRight className="ml-auto h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              {form.lines.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>COA</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Amount (Rp)</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.lines.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="font-mono text-xs text-muted-foreground">{line.coa_code}</div>
                          <div className="text-sm">{line.coa_name}</div>
                        </TableCell>
                        <TableCell>
                          <Select value={line.category} onValueChange={v => updateLine(idx, "category", v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(c => (
                                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input type="number" className="text-right h-8" value={line.amount}
                            onChange={e => updateLine(idx, "amount", parseFloat(e.target.value) || 0)}
                            data-testid={`line-amount-${idx}`} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeLine(idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell colSpan={2}>TOTAL</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(form.lines.reduce((s, l) => s + parseFloat(l.amount || 0), 0))}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={submitting} data-testid="confirm-save-budget">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// ── Budget Excel Import Dialog ──────────────────────────────────────────────
function BudgetImportDialog({ open, onOpenChange, onImported }) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const downloadTemplate = async () => {
    try {
      const r = await api.get("/budget/template-excel", { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url; a.download = "budget_template.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Gagal mengunduh template");
    }
  };

  const handleImport = async () => {
    if (!file) { toast.error("Pilih file terlebih dahulu"); return; }
    if (!period) { toast.error("Pilih periode"); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post(`/budget/import-excel?period=${period}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const d = r.data?.data;
      setResult(d);
      if (d?.success) {
        toast.success(`Import berhasil: ${d.imported} baris budget`);
        onImported();
      } else {
        toast.error("Import gagal: " + (d?.errors?.[0] || "Unknown error"));
      }
    } catch (e) {
      toast.error(e.response?.data?.errors?.[0]?.message || "Gagal import");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setFile(null); setResult(null); } onOpenChange(v); }}>
      <DialogContent className="max-w-md" data-testid="budget-import-dialog">
        <DialogHeader>
          <DialogTitle>Import Budget dari Excel</DialogTitle>
          <DialogDescription>
            Upload file Excel (.xlsx) dengan kolom: coa_code, amount, category (opsional)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Header Excel: <strong>coa_code | coa_name | amount | category</strong>.
              Category: food_cost, beverage_cost, labor_cost, rent, dll.
            </AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" className="w-full" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" /> Download Template Excel
          </Button>
          <div className="space-y-2">
            <Label>Periode *</Label>
            <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>File Excel (.xlsx)</Label>
            <Input type="file" accept=".xlsx,.csv" ref={fileRef}
                   onChange={e => { setFile(e.target.files[0]); setResult(null); }}
                   data-testid="budget-import-file" />
          </div>
          {result && (
            <div className="rounded-md border p-3 space-y-1 text-sm">
              {result.success ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.imported} baris berhasil diimport untuk periode {result.period}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Import gagal
                </div>
              )}
              {result.errors?.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs font-medium text-destructive">{result.errors.length} error:</div>
                  {result.errors.slice(0, 5).map((e, i) => (
                    <div key={i} className="text-xs text-destructive">{e}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { setFile(null); setResult(null); onOpenChange(false); }}>Tutup</Button>
          <Button onClick={handleImport} disabled={busy || !file} className="rounded-full"
                  data-testid="budget-import-submit">
            {busy ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
