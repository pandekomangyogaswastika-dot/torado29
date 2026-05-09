import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Plus, Trash2, Search, Star, ChevronLeft, ChevronRight,
  RefreshCw, Send, Package, Info, TrendingUp, TrendingDown
} from "lucide-react";

const fmt = (n) => n != null ? new Intl.NumberFormat("id-ID").format(n) : "-";

export default function FdoPage() {
  const { user } = useAuth();

  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [fdoList, setFdoList] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [lines, setLines] = useState([]);
  const [reqDate, setReqDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [favorites, setFavorites] = useState([]);

  // Item search
  const [itemSearch, setItemSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState(null);
  const searchRef = useRef(null);

  const fetchOutlets = useCallback(async () => {
    const res = await api.get("/master/outlets?per_page=100");
    const all = res.data.data || [];
    const myOutlets = user?.outlet_ids?.length
      ? all.filter(o => user.outlet_ids.includes(o.id))
      : all;
    setOutlets(myOutlets);
    if (!selectedOutlet && myOutlets.length > 0) setSelectedOutlet(myOutlets[0].id);
  }, [selectedOutlet, user]);

  const fetchFdoList = useCallback(async () => {
    if (!selectedOutlet) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ outlet_id: selectedOutlet, page, per_page: 20 });
      const res = await api.get(`/outlet/fdo?${params}`);
      setFdoList(res.data.data || []);
      setMeta(res.data.meta || {});
    } finally { setLoading(false); }
  }, [selectedOutlet, page]);

  const fetchFavorites = useCallback(async () => {
    if (!selectedOutlet) return;
    const res = await api.get(`/outlet/fdo/favorites?outlet_id=${selectedOutlet}&limit=8`);
    setFavorites(res.data.data || []);
  }, [selectedOutlet]);

  useEffect(() => { fetchOutlets(); }, [fetchOutlets]);
  useEffect(() => { fetchFdoList(); fetchFavorites(); }, [fetchFdoList, fetchFavorites]);

  const searchItems = useCallback(async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q)}&per_page=8`);
      const resultItems = (res.data.data?.items || res.data.data || []);
      // Fetch market ref prices for found items
      if (resultItems.length > 0) {
        const itemIds = resultItems.map(i => i.id).join(",");
        try {
          const refRes = await api.get(`/market-list/ref-prices/bulk?item_ids=${itemIds}`);
          const refMap = refRes.data.data || {};
          resultItems.forEach(item => {
            item._ref_price = refMap[item.id];
          });
        } catch (_) {}
      }
      setSearchResults(resultItems);
      setShowDropdown(true);
    } finally { setSearchLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchItems(itemSearch), 300);
    return () => clearTimeout(t);
  }, [itemSearch, searchItems]);

  const addLine = (item) => {
    const ref = item._ref_price;
    setLines(prev => [...prev, {
      item_id: item.id,
      name: item.name,
      unit: item.unit_default || "pcs",
      qty: 1,
      notes: "",
      ref_price: ref?.ref_price || null,
      ref_quarter: ref?.quarter_label || null,
    }]);
    setItemSearch("");
    setShowDropdown(false);
  };

  const addFavorite = (fav) => {
    if (lines.some(l => l.item_id === fav.item_id)) return;
    setLines(prev => [...prev, {
      item_id: fav.item_id,
      name: fav.item_name || fav.name,
      unit: fav.unit || "pcs",
      qty: 1,
      notes: "",
      ref_price: null,
      ref_quarter: null,
    }]);
  };

  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));
  const updateLine = (idx, field, value) => setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));

  const handleSubmit = async () => {
    if (!selectedOutlet) return alert("Pilih outlet");
    if (lines.length === 0) return alert("Tambahkan minimal 1 item");
    setSaving(true);
    try {
      await api.post("/outlet/fdo", {
        outlet_id: selectedOutlet,
        request_date: reqDate,
        notes,
        lines: lines.map(l => ({
          item_id: l.item_id,
          name: l.name,
          unit: l.unit,
          qty: parseFloat(l.qty),
          notes: l.notes,
        })),
      });
      setShowForm(false);
      setLines([]);
      setNotes("");
      await fetchFdoList();
    } catch (e) {
      alert(e.response?.data?.errors?.[0]?.message || "Gagal submit FDO");
    } finally { setSaving(false); }
  };

  const statusBadge = (status) => {
    const map = {
      draft: "bg-gray-100 text-gray-700",
      submitted: "bg-blue-100 text-blue-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      converted: "bg-purple-100 text-purple-700",
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>{status?.toUpperCase()}</span>;
  };

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FDO — Floor Daily Order</h1>
          <p className="text-sm text-gray-500 mt-1">Permintaan harian untuk floor/service department</p>
        </div>
        <div className="flex gap-2">
          {outlets.length > 1 && (
            <Select value={selectedOutlet} onValueChange={v => { setSelectedOutlet(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>{outlets.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={fetchFdoList}><RefreshCw className="h-4 w-4" /></Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />Buat FDO
          </Button>
        </div>
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />Item Sering Dipesan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2 flex-wrap">
              {favorites.map((fav, i) => (
                <button
                  key={i}
                  onClick={() => { setShowForm(true); setTimeout(() => addFavorite(fav), 100); }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:border-indigo-300 border border-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  {fav.item_name || fav.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Tanggal</TableHead>
                <TableHead>No. Dokumen</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead className="text-center">Jumlah Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Memuat...</TableCell></TableRow>
              ) : fdoList.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <div>Belum ada FDO</div>
                </TableCell></TableRow>
              ) : fdoList.map(fdo => (
                <TableRow key={fdo.id} className="hover:bg-gray-50">
                  <TableCell>{fdo.request_date || fdo.created_at?.slice(0,10)}</TableCell>
                  <TableCell className="font-mono text-sm">{fdo.doc_no || "-"}</TableCell>
                  <TableCell>{fdo.outlet_id}</TableCell>
                  <TableCell className="text-center">{fdo.lines?.length || 0}</TableCell>
                  <TableCell>{statusBadge(fdo.status)}</TableCell>
                  <TableCell className="text-sm text-gray-500">{fdo.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">{meta.total || 0} FDO</div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page * 20 >= (meta.total || 0)} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FDO Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat FDO — Floor Daily Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Outlet <span className="text-red-500">*</span></label>
                <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{outlets.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tanggal Request <span className="text-red-500">*</span></label>
                <Input type="date" value={reqDate} onChange={e => setReqDate(e.target.value)} className="mt-1" />
              </div>
            </div>

            {/* Item search */}
            <div>
              <label className="text-sm font-medium">Tambah Item</label>
              <div className="relative mt-1" ref={searchRef}>
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari item dari market list..."
                  className="pl-9"
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-50 mt-1 max-h-64 overflow-y-auto">
                    {searchResults.map(item => (
                      <button
                        key={item.id}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start justify-between border-b last:border-b-0"
                        onClick={() => addLine(item)}
                      >
                        <div>
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-400">{item.unit_default} · {item.category_name || "Tanpa Kategori"}</div>
                        </div>
                        {item._ref_price && (
                          <div className="text-right">
                            <div className="text-xs font-medium text-blue-700">Rp {fmt(item._ref_price.ref_price)}</div>
                            <div className="text-xs text-gray-400">{item._ref_price.quarter_label}</div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lines table */}
            {lines.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Item yang Dipesan</label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Item</TableHead>
                        <TableHead className="w-24">Qty</TableHead>
                        <TableHead className="w-24">Unit</TableHead>
                        <TableHead className="text-right">Harga Ref.</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((ln, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="font-medium text-sm">{ln.name}</div>
                            {ln.ref_price && (
                              <div className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                                <Info className="h-3 w-3" />Ref {ln.ref_quarter}: Rp {fmt(ln.ref_price)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={ln.qty}
                              onChange={e => updateLine(idx, "qty", e.target.value)}
                              className="h-8 text-center"
                              min="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={ln.unit}
                              onChange={e => updateLine(idx, "unit", e.target.value)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {ln.ref_price ? (
                              <span className="text-xs text-blue-700 font-medium">
                                Rp {fmt(ln.ref_price)}
                              </span>
                            ) : <span className="text-xs text-gray-400">-</span>}
                          </TableCell>
                          <TableCell>
                            <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Catatan</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} className="mt-1" placeholder="Catatan tambahan..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || lines.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Send className="h-4 w-4 mr-1" />
              {saving ? "Mengirim..." : "Submit FDO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
