import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "../../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../../components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../../components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "../../components/ui/tooltip";
import {
  TrendingUp, TrendingDown, Minus, Download, Plus, Search,
  RefreshCw, CheckCircle, Clock, Filter, ChevronLeft, ChevronRight,
  BarChart2, Star, Package, AlertTriangle
} from "lucide-react";

const fmt = (n) => n != null ? new Intl.NumberFormat("id-ID").format(n) : "-";

const VarianceBadge = ({ pct }) => {
  if (pct == null) return <span className="text-gray-400 text-xs">-</span>;
  const abs = Math.abs(pct);
  if (pct > 0.5) return (
    <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-xs">
      <TrendingUp className="h-3 w-3" />+{pct.toFixed(1)}%
    </span>
  );
  if (pct < -0.5) return (
    <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-xs">
      <TrendingDown className="h-3 w-3" />{pct.toFixed(1)}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-gray-500 text-xs">
      <Minus className="h-3 w-3" />0%
    </span>
  );
};

const StatusBadge = ({ status }) => {
  if (status === "pending_review") return (
    <Badge variant="outline" className="text-yellow-700 border-yellow-400 bg-yellow-50 text-xs">
      <Clock className="h-3 w-3 mr-1" />Pending Review
    </Badge>
  );
  return (
    <Badge variant="outline" className="text-green-700 border-green-400 bg-green-50 text-xs">
      <CheckCircle className="h-3 w-3 mr-1" />Aktif
    </Badge>
  );
};

export default function MarketListPage() {
  const { user } = useAuth();

  const [quarters, setQuarters] = useState([]);
  const [activeQuarter, setActiveQuarter] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, per_page: 50 });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [filters, setFilters] = useState({ search: "", category_id: "", ml_status: "", brand: "" });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Modals
  const [showCreateQuarter, setShowCreateQuarter] = useState(false);
  const [showSetPrice, setShowSetPrice] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showQuarterHistory, setShowQuarterHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemHistory, setItemHistory] = useState([]);
  const [newQuarter, setNewQuarter] = useState({ year: 2026, quarter: 2 });
  const [priceForm, setPriceForm] = useState({ unit: "", ref_price: "", notes: "" });
  const [approveForm, setApproveForm] = useState({ category_id: "", ref_price: "" });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const canManage = user?.permissions?.includes("procurement.market_list.manage");

  const fetchQuarters = useCallback(async () => {
    const res = await api.get("/market-list/quarters");
    setQuarters(res.data.data || []);
    const aq = res.data.data?.find(q => q.status === "active");
    setActiveQuarter(aq || null);
    if (!selectedQuarter && aq) setSelectedQuarter(aq.id);
  }, [selectedQuarter]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, per_page: 50,
        ...(selectedQuarter && { quarter_id: selectedQuarter }),
        ...(filters.search && { search: filters.search }),
        ...(filters.category_id && { category_id: filters.category_id }),
        ...(filters.ml_status && { ml_status: filters.ml_status }),
        ...(filters.brand && { brand: filters.brand }),
      });
      const res = await api.get(`/market-list/items?${params}`);
      setItems(res.data.data || []);
      setMeta(res.data.meta || {});
    } finally {
      setLoading(false);
    }
  }, [page, selectedQuarter, filters]);

  const fetchCategories = useCallback(async () => {
    const res = await api.get("/master/categories?per_page=100");
    setCategories(res.data.data || []);
  }, []);

  const fetchBrands = useCallback(async () => {
    const res = await api.get("/master/brands?per_page=100");
    setBrands(res.data.data || []);
  }, []);

  useEffect(() => { fetchQuarters(); fetchCategories(); fetchBrands(); }, [fetchQuarters, fetchCategories, fetchBrands]);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreateQuarter = async () => {
    setSaving(true);
    try {
      await api.post("/market-list/quarters", newQuarter);
      await fetchQuarters();
      setShowCreateQuarter(false);
    } catch (e) {
      alert(e.response?.data?.errors?.[0]?.message || "Gagal membuat quarter");
    } finally { setSaving(false); }
  };

  const handleActivateQuarter = async (qId) => {
    if (!window.confirm("Aktifkan quarter ini? Quarter aktif sebelumnya akan ditutup.")) return;
    try {
      await api.post(`/market-list/quarters/${qId}/activate`, {});
      await fetchQuarters();
    } catch (e) {
      alert(e.response?.data?.errors?.[0]?.message || "Gagal");
    }
  };

  const openSetPrice = (item) => {
    setSelectedItem(item);
    setPriceForm({ unit: item.unit_default || "pcs", ref_price: item.ref_price || "", notes: "" });
    setShowSetPrice(true);
  };

  const handleSetPrice = async () => {
    if (!selectedQuarter) return alert("Pilih quarter terlebih dahulu");
    setSaving(true);
    try {
      await api.post("/market-list/prices", {
        quarter_id: selectedQuarter,
        item_id: selectedItem.id,
        unit: priceForm.unit,
        ref_price: parseFloat(priceForm.ref_price),
        notes: priceForm.notes || undefined,
      });
      setShowSetPrice(false);
      await fetchItems();
    } catch (e) {
      alert(e.response?.data?.errors?.[0]?.message || "Gagal");
    } finally { setSaving(false); }
  };

  const openApprove = (item) => {
    setSelectedItem(item);
    setApproveForm({ category_id: "", ref_price: "" });
    setShowApprove(true);
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await api.post(`/market-list/items/${selectedItem.id}/approve`, {
        category_id: approveForm.category_id,
        ref_price: approveForm.ref_price ? parseFloat(approveForm.ref_price) : undefined,
      });
      setShowApprove(false);
      await fetchItems();
    } catch (e) {
      alert(e.response?.data?.errors?.[0]?.message || "Gagal approve");
    } finally { setSaving(false); }
  };

  const openHistory = async (item) => {
    setSelectedItem(item);
    const res = await api.get(`/market-list/items/${item.id}/prices`);
    setItemHistory(res.data.data || []);
    setShowQuarterHistory(true);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const year = activeQuarter?.year || 2026;
      const { API_BASE } = await import("@/lib/api");
      const token = localStorage.getItem("aurora_token") || "";
      const res = await fetch(`${API_BASE}/market-list/export.xlsx?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `market_list_${year}.xlsx`;
      a.click();
    } catch (e) {
      alert("Gagal export");
    } finally { setExporting(false); }
  };

  const pendingCount = items.filter(i => i.ml_status === "pending_review").length;

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market List</h1>
          <p className="text-sm text-gray-500 mt-1">Harga acuan kuartalan — referensi untuk KDO/BDO/FDO</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchItems}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
          {canManage && (
            <Button size="sm" onClick={() => setShowCreateQuarter(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-1" />Buat Quarter
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-700">{meta.total || 0}</div>
            <div className="text-xs text-gray-500">Total Item</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
            <div className="text-xs text-gray-500">Pending Review</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-700">
              {activeQuarter?.label || "-"}
            </div>
            <div className="text-xs text-gray-500">Quarter Aktif</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-700">{quarters.length}</div>
            <div className="text-xs text-gray-500">Total Quarter</div>
          </CardContent>
        </Card>
      </div>

      {/* Quarter selector */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="font-medium text-sm text-gray-700">Tampilkan harga untuk:</div>
            <div className="flex gap-2 flex-wrap">
              {quarters.map(q => (
                <button
                  key={q.id}
                  onClick={() => { setSelectedQuarter(q.id); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedQuarter === q.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {q.label}
                  {q.status === "active" && (
                    <span className="ml-1 text-xs bg-green-100 text-green-700 px-1 rounded">Aktif</span>
                  )}
                </button>
              ))}
            </div>
            {canManage && selectedQuarter && selectedQuarter !== activeQuarter?.id && (
              <Button
                size="sm"
                variant="outline"
                className="border-green-400 text-green-700"
                onClick={() => handleActivateQuarter(selectedQuarter)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />Aktifkan Quarter Ini
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari item..."
                className="pl-9"
                value={filters.search}
                onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
              />
            </div>
            <Select value={filters.category_id} onValueChange={v => { setFilters(f => ({ ...f, category_id: v === "all" ? "" : v })); setPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.ml_status} onValueChange={v => { setFilters(f => ({ ...f, ml_status: v === "all" ? "" : v })); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.brand} onValueChange={v => { setFilters(f => ({ ...f, brand: v === "all" ? "" : v })); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Semua Brand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Brand</SelectItem>
                {brands.map(b => <SelectItem key={b.id} value={b.code}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Harga Referensi</TableHead>
                  <TableHead className="text-right">Harga Sebelumnya</TableHead>
                  <TableHead className="text-center">Variance</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-400">Memuat...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-12 text-gray-400">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <div>Tidak ada item ditemukan</div>
                  </TableCell></TableRow>
                ) : items.map((item, idx) => (
                  <TableRow
                    key={item.id}
                    className={item.ml_status === "pending_review" ? "bg-yellow-50" : "hover:bg-gray-50"}
                  >
                    <TableCell className="text-gray-400 text-sm">{(page - 1) * 50 + idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.code}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{item.category_name || "-"}</span>
                    </TableCell>
                    <TableCell><span className="text-sm">{item.unit_default || "-"}</span></TableCell>
                    <TableCell><StatusBadge status={item.ml_status} /></TableCell>
                    <TableCell className="text-right">
                      {item.ref_price != null ? (
                        <span className="font-semibold text-gray-900">Rp {fmt(item.ref_price)}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Belum ada</span>
                      )}
                      {item.ref_price_unit && <div className="text-xs text-gray-400">{item.ref_quarter_label}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.prev_ref_price ? (
                        <span className="text-gray-500 text-sm">Rp {fmt(item.prev_ref_price)}</span>
                      ) : <span className="text-gray-300 text-sm">-</span>}
                      {item.prev_quarter_label && <div className="text-xs text-gray-400">{item.prev_quarter_label}</div>}
                    </TableCell>
                    <TableCell className="text-center">
                      <VarianceBadge pct={item.ref_variance_pct} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(item.brand_availability || []).map(b => (
                          <span key={b} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{b.toUpperCase()}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openHistory(item)} title="Histori Harga">
                          <BarChart2 className="h-4 w-4" />
                        </Button>
                        {canManage && item.ml_status !== "pending_review" && (
                          <Button size="sm" variant="ghost" onClick={() => openSetPrice(item)} title="Set Harga">
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        {canManage && item.ml_status === "pending_review" && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs px-2" onClick={() => openApprove(item)}>
                            <CheckCircle className="h-3 w-3 mr-1" />Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">
              {meta.total > 0 ? `Menampilkan ${(page-1)*50+1}–${Math.min(page*50, meta.total)} dari ${meta.total} item` : ""}
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page * 50 >= (meta.total || 0)} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Quarter Modal */}
      <Dialog open={showCreateQuarter} onOpenChange={setShowCreateQuarter}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buat Quarter Baru</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Tahun</label>
              <Input type="number" value={newQuarter.year} onChange={e => setNewQuarter(q => ({ ...q, year: parseInt(e.target.value) }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Quarter</label>
              <Select value={String(newQuarter.quarter)} onValueChange={v => setNewQuarter(q => ({ ...q, quarter: parseInt(v) }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Q1 (Jan–Mar)</SelectItem>
                  <SelectItem value="2">Q2 (Apr–Jun)</SelectItem>
                  <SelectItem value="3">Q3 (Jul–Sep)</SelectItem>
                  <SelectItem value="4">Q4 (Okt–Des)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateQuarter(false)}>Batal</Button>
            <Button onClick={handleCreateQuarter} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? "Menyimpan..." : "Buat Quarter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Price Modal */}
      <Dialog open={showSetPrice} onOpenChange={setShowSetPrice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Harga Referensi</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="text-sm text-gray-500 mb-4">
              Item: <strong>{selectedItem?.name}</strong> | Quarter: <strong>{quarters.find(q => q.id === selectedQuarter)?.label}</strong>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Unit</label>
                <Input value={priceForm.unit} onChange={e => setPriceForm(f => ({ ...f, unit: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Harga Referensi (Rp)</label>
                <Input type="number" value={priceForm.ref_price} onChange={e => setPriceForm(f => ({ ...f, ref_price: e.target.value }))} className="mt-1" placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Catatan (opsional)</label>
                <Input value={priceForm.notes} onChange={e => setPriceForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetPrice(false)}>Batal</Button>
            <Button onClick={handleSetPrice} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? "Menyimpan..." : "Simpan Harga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Item Baru</DialogTitle></DialogHeader>
          <div className="py-2">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm">
              <strong>{selectedItem?.name}</strong> ditambahkan oleh KDO/BDO/FDO dan perlu approval.
            </div>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Kategori <span className="text-red-500">*</span></label>
                <Select value={approveForm.category_id} onValueChange={v => setApproveForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Harga Referensi Q Aktif (opsional)</label>
                <Input type="number" value={approveForm.ref_price} onChange={e => setApproveForm(f => ({ ...f, ref_price: e.target.value }))} className="mt-1" placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprove(false)}>Batal</Button>
            <Button onClick={handleApprove} disabled={saving || !approveForm.category_id} className="bg-green-600 hover:bg-green-700 text-white">
              {saving ? "Menyimpan..." : "Approve Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quarter History Modal */}
      <Dialog open={showQuarterHistory} onOpenChange={setShowQuarterHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histori Harga: {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {itemHistory.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Belum ada histori harga</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quarter</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Harga Referensi</TableHead>
                    <TableHead className="text-right">Harga Sebelumnya</TableHead>
                    <TableHead className="text-center">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemHistory.map((h, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{h.quarter_label}</TableCell>
                      <TableCell>{h.unit}</TableCell>
                      <TableCell className="text-right font-semibold">Rp {fmt(h.ref_price)}</TableCell>
                      <TableCell className="text-right text-gray-500">
                        {h.previous_ref_price ? `Rp ${fmt(h.previous_ref_price)}` : "-"}
                      </TableCell>
                      <TableCell className="text-center"><VarianceBadge pct={h.variance_pct} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
