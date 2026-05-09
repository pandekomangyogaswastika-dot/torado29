/**
 * RFQ Detail Page — Sprint E
 * Shows RFQ detail, vendor quote entry, comparison matrix, and accept-to-PO flow.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Plus, Send, CheckCircle2, X, RefreshCw,
  Trophy, Clock, FileCheck, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatCurrency, formatDateID } from "@/lib/format";

// ──── RFQ Create Form (when navigating to /rfq/new)
export function RFQForm() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    vendor_ids: [],
    deadline: "",
    notes: "",
  });
  const [lines, setLines] = useState([{ item_name: "", qty: 1, uom: "pcs", est_unit_price: 0 }]);

  useEffect(() => {
    api.get("/master/vendors").then(r => setVendors(r.data.data?.items || r.data.data || []));
    api.get("/master/items").then(r => setItems(r.data.data?.items || r.data.data || []));
  }, []);

  const addLine = () => setLines(l => [...l, { item_name: "", qty: 1, uom: "pcs", est_unit_price: 0 }]);
  const removeLine = (i) => setLines(l => l.filter((_, idx) => idx !== i));
  const updateLine = (i, key, val) => setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [key]: val } : ln));

  const handleSubmit = async () => {
    if (!form.title) return toast.error("Judul RFQ wajib diisi");
    if (form.vendor_ids.length === 0) return toast.error("Pilih setidaknya 1 vendor");
    if (lines.every(l => !l.item_name)) return toast.error("Tambahkan setidaknya 1 item");
    setSaving(true);
    try {
      const payload = {
        ...form,
        items: lines.filter(l => l.item_name).map((l, i) => ({ ...l, line_no: i + 1 })),
      };
      const res = await api.post("/rfq", payload);
      toast.success(`RFQ ${res.data.data.rfq_no} dibuat`);
      navigate(`/procurement/rfq/${res.data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || "Gagal membuat RFQ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/procurement/rfq")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Buat RFQ Baru</h1>
          <p className="text-sm text-muted-foreground">Request for Quotation ke vendor</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Informasi RFQ</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Judul RFQ *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Mis: Permintaan Harga Bahan Baku Mei 2026" />
          </div>
          <div className="space-y-1">
            <Label>Deadline Balasan</Label>
            <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Catatan</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Syarat pengiriman, spesifikasi khusus..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Vendor *</CardTitle>
            <Badge variant="outline">{form.vendor_ids.length} dipilih</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {vendors.slice(0, 20).map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, vendor_ids: f.vendor_ids.includes(v.id) ? f.vendor_ids.filter(x => x !== v.id) : [...f.vendor_ids, v.id] }))}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  form.vendor_ids.includes(v.id) ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="h-2 w-2 rounded-full" style={{ background: form.vendor_ids.includes(v.id) ? "currentColor" : "transparent", border: "1.5px solid currentColor" }} />
                {v.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Item yang Diminta</CardTitle>
            <Button size="sm" variant="outline" onClick={addLine}><Plus className="h-3.5 w-3.5 mr-1" />Tambah Item</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <Input placeholder="Nama item" value={line.item_name} onChange={e => updateLine(i, "item_name", e.target.value)} />
              </div>
              <div className="w-20">
                <Input type="number" min="1" placeholder="Qty" value={line.qty} onChange={e => updateLine(i, "qty", Number(e.target.value))} />
              </div>
              <div className="w-20">
                <Input placeholder="UoM" value={line.uom} onChange={e => updateLine(i, "uom", e.target.value)} />
              </div>
              <div className="w-28">
                <Input type="number" placeholder="Est. Harga" value={line.est_unit_price || ""} onChange={e => updateLine(i, "est_unit_price", Number(e.target.value))} />
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeLine(i)}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/procurement/rfq")}>Batal</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Buat RFQ
        </Button>
      </div>
    </div>
  );
}

// ──── RFQ Detail
export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quoteDialog, setQuoteDialog] = useState(false);
  const [quoteVendorId, setQuoteVendorId] = useState("");
  const [quoteForm, setQuoteForm] = useState({ lines: [], notes: "" });
  const [saving, setSaving] = useState(false);
  const [accepting, setAccepting] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rfqRes, matRes] = await Promise.all([
        api.get(`/rfq/${id}`),
        api.get(`/rfq/${id}/compare`).catch(() => ({ data: { data: null } })),
      ]);
      setRfq(rfqRes.data.data);
      setMatrix(matRes.data.data);
    } catch {
      toast.error("Gagal memuat RFQ");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSendRFQ = async () => {
    try {
      await api.post(`/rfq/${id}/send`);
      toast.success("Status RFQ diubah ke Dikirim");
      load();
    } catch {
      toast.error("Gagal mengupdate status");
    }
  };

  const openQuoteDialog = (vendorId, vendorName) => {
    setQuoteVendorId(vendorId);
    const existingQuote = rfq?.quotes?.find(q => q.vendor_id === vendorId);
    setQuoteForm({
      lines: (rfq?.items || []).map(item => {
        const existingLine = existingQuote?.lines?.find(l => l.item_id === item.item_id);
        return {
          item_id: item.item_id,
          item_name: item.item_name,
          unit_price: existingLine?.unit_price || 0,
          moq: existingLine?.moq || 1,
          lead_time_days: existingLine?.lead_time_days || 3,
          notes: existingLine?.notes || "",
        };
      }),
      notes: existingQuote?.notes || "",
    });
    setQuoteDialog(true);
  };

  const handleSaveQuote = async () => {
    setSaving(true);
    try {
      await api.post(`/rfq/${id}/quotes/${quoteVendorId}`, quoteForm);
      toast.success("Quote disimpan");
      setQuoteDialog(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || "Gagal menyimpan quote");
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async (vendorId) => {
    if (!window.confirm("Terima quote dari vendor ini dan buat PO draft?")) return;
    setAccepting(vendorId);
    try {
      const res = await api.post(`/rfq/${id}/accept/${vendorId}`);
      toast.success(`PO ${res.data.data?.po?.po_no || ""} berhasil dibuat!`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || "Gagal menerima quote");
    } finally {
      setAccepting("");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!rfq) return <div className="p-6 text-center text-muted-foreground">RFQ tidak ditemukan</div>;

  const statusColors = {
    draft: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
    sent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    quotes_received: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const quotedVendorIds = (rfq.quotes || []).map(q => q.vendor_id);
  const vendorMap = rfq.vendor_map || {};

  return (
    <div className="space-y-6 p-6" data-testid="rfq-detail-page">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/procurement/rfq")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{rfq.rfq_no}</h1>
            <Badge variant="outline" className={statusColors[rfq.status] || ""}>{rfq.status}</Badge>
            {rfq.po_id && (
              <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <FileCheck className="h-3 w-3" />PO Dibuat
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{rfq.title}</p>
        </div>
        <div className="flex gap-2">
          {rfq.status === "draft" && (
            <Button size="sm" onClick={handleSendRFQ}>
              <Send className="h-4 w-4 mr-2" />Tandai Dikirim
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quotes">Quotes ({rfq.quotes?.length || 0})</TabsTrigger>
          <TabsTrigger value="compare">Bandingkan</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Items Diminta</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(rfq.items || []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{item.item_name}</span>
                      <span className="text-muted-foreground">{item.qty} {item.uom}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Vendor yang Dikirimi</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(rfq.vendor_ids || []).map(vid => (
                    <div key={vid} className="flex items-center justify-between text-sm">
                      <span>{vendorMap[vid] || vid}</span>
                      {quotedVendorIds.includes(vid)
                        ? <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Quoted</Badge>
                        : <Badge variant="outline" className="text-xs">Belum</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          {rfq.notes && (
            <Card><CardContent className="pt-4"><p className="text-sm"><strong>Catatan:</strong> {rfq.notes}</p></CardContent></Card>
          )}
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{rfq.quotes?.length || 0} dari {rfq.vendor_ids?.length || 0} vendor telah memberikan quote</p>
          </div>
          {/* Vendor cards - enter/view quotes */}
          <div className="grid gap-4 sm:grid-cols-2">
            {(rfq.vendor_ids || []).map(vid => {
              const vname = vendorMap[vid] || vid;
              const quote = rfq.quotes?.find(q => q.vendor_id === vid);
              return (
                <Card key={vid}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{vname}</CardTitle>
                      {quote
                        ? <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Quoted</Badge>
                        : <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>
                      }
                    </div>
                  </CardHeader>
                  <CardContent>
                    {quote && (
                      <div className="mb-3 space-y-1">
                        {quote.lines?.map((ln, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{ln.item_name || ln.item_id}</span>
                            <span className="font-medium">{formatCurrency(ln.unit_price)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                          <span>Total Est.</span>
                          <span>{formatCurrency(quote.total_est || 0)}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={quote ? "outline" : "default"}
                        className="flex-1"
                        onClick={() => openQuoteDialog(vid, vname)}
                        disabled={rfq.status === "accepted" || rfq.status === "cancelled"}
                      >
                        {quote ? "Edit Quote" : "Masukkan Quote"}
                      </Button>
                      {quote && rfq.status !== "accepted" && rfq.status !== "cancelled" && (
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleAccept(vid)}
                          disabled={accepting === vid}
                        >
                          {accepting === vid
                            ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            : <Trophy className="h-4 w-4 mr-1" />}
                          Terima
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="mt-4">
          {!matrix || !matrix.vendors?.length ? (
            <Card><CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Belum ada quote untuk dibandingkan</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">Item</TableHead>
                          <TableHead>Qty</TableHead>
                          {matrix.vendors.map(v => (
                            <TableHead key={v.vendor_id} className="text-center">
                              {v.vendor_name}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matrix.items.map(item => (
                          <TableRow key={item.item_id}>
                            <TableCell className="font-medium text-sm">{item.item_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.qty} {item.uom}</TableCell>
                            {matrix.vendors.map(v => {
                              const q = item.quotes[v.vendor_id];
                              return (
                                <TableCell key={v.vendor_id} className="text-center">
                                  {q?.unit_price != null ? (
                                    <div className={`rounded px-2 py-0.5 text-sm ${
                                      q.is_cheapest ? "bg-emerald-500/15 text-emerald-700 font-semibold" : ""
                                    }`}>
                                      {formatCurrency(q.unit_price)}
                                      {q.is_cheapest && <Trophy className="inline h-3 w-3 ml-1" />}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold bg-muted/30">
                          <TableCell>Total Estimasi</TableCell>
                          <TableCell />
                          {matrix.vendors.map(v => (
                            <TableCell key={v.vendor_id} className="text-center">
                              {formatCurrency(v.total_est)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {rfq.status !== "accepted" && rfq.status !== "cancelled" && (
                <div className="flex flex-wrap gap-3">
                  {matrix.vendors.map(v => (
                    <Button
                      key={v.vendor_id}
                      onClick={() => handleAccept(v.vendor_id)}
                      disabled={accepting === v.vendor_id || !rfq.quotes?.some(q => q.vendor_id === v.vendor_id)}
                      className="gap-2"
                    >
                      {accepting === v.vendor_id
                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                        : <Trophy className="h-4 w-4" />}
                      Terima {v.vendor_name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quote Entry Dialog */}
      <Dialog open={quoteDialog} onOpenChange={setQuoteDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Masukkan Quote — {vendorMap[quoteVendorId] || quoteVendorId}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {quoteForm.lines.map((line, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium">{line.item_name || `Item ${i + 1}`}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Harga Satuan (Rp)</Label>
                    <Input type="number" min="0" value={line.unit_price || ""}
                      onChange={e => setQuoteForm(f => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, unit_price: Number(e.target.value) } : l) }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Min. Order</Label>
                    <Input type="number" min="1" value={line.moq || 1}
                      onChange={e => setQuoteForm(f => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, moq: Number(e.target.value) } : l) }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Lead Time (hari)</Label>
                    <Input type="number" min="1" value={line.lead_time_days || 3}
                      onChange={e => setQuoteForm(f => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, lead_time_days: Number(e.target.value) } : l) }))}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="space-y-1">
              <Label>Catatan Vendor</Label>
              <Textarea rows={2} value={quoteForm.notes}
                onChange={e => setQuoteForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Kondisi pembayaran, syarat khusus..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteDialog(false)}>Batal</Button>
            <Button onClick={handleSaveQuote} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Simpan Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
