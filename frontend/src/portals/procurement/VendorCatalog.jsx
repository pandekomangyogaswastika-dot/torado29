/** Vendor Item Catalog — Smart Procurement
 * Shows per-vendor item catalog with actual prices, price history,
 * and comparison vs Market List reference price.
 */
import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "../../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../../components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../../components/ui/table";
import {
  TrendingUp, TrendingDown, Search, RefreshCw, Package,
  History, ChevronLeft, ChevronRight, Building2, Star,
  AlertTriangle, CheckCircle, XCircle
} from "lucide-react";

const fmt = (n) => n != null ? new Intl.NumberFormat("id-ID").format(n) : "-";

const DeviationBadge = ({ pct }) => {
  if (pct == null) return <span className="text-gray-400 text-xs">No ref</span>;
  const cls = pct > 10 ? "bg-red-100 text-red-700" : pct < -10 ? "bg-green-100 text-green-700" : pct > 0 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700";
  const icon = pct > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>
      {icon}{pct > 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
};

const AvailBadge = ({ status }) => {
  if (status === "available") return (
    <span className="inline-flex items-center gap-1 text-xs text-green-700">
      <CheckCircle className="h-3 w-3" />Tersedia
    </span>
  );
  if (status === "unavailable") return (
    <span className="inline-flex items-center gap-1 text-xs text-red-700">
      <XCircle className="h-3 w-3" />Tidak Tersedia
    </span>
  );
  return (
    <span className="text-xs text-gray-400">Discontinued</span>
  );
};

export default function VendorCatalog() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [catalogMeta, setCatalogMeta] = useState({ total: 0 });
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVendorItem, setSelectedVendorItem] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [vendorSearch, setVendorSearch] = useState("");

  const fetchVendors = useCallback(async () => {
    setVendorLoading(true);
    try {
      const res = await api.get("/master/vendors?per_page=100");
      setVendors(res.data.data || []);
    } finally { setVendorLoading(false); }
  }, []);

  const fetchCatalog = useCallback(async () => {
    if (!selectedVendor) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: catalogPage,
        per_page: 30,
        ...(catalogSearch && { search: catalogSearch }),
      });
      const res = await api.get(`/vendor-items/vendor/${selectedVendor.id}?${params}`);
      setCatalog(res.data.data || []);
      setCatalogMeta(res.data.meta || {});
    } finally { setLoading(false); }
  }, [selectedVendor, catalogPage, catalogSearch]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);
  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  const openHistory = async (item) => {
    setSelectedVendorItem(item);
    const res = await api.get(`/vendor-items/history/${selectedVendor.id}/${item.item_id}?limit=20`);
    setPriceHistory(res.data.data || []);
    setShowHistory(true);
  };

  const toggleAvailability = async (item) => {
    const isAvail = item.availability_status === "available";
    const action = isAvail ? "unavailable" : "available";
    if (!window.confirm(`${isAvail ? "Tandai tidak tersedia" : "Tandai tersedia"}: ${item.item_name}?`)) return;
    try {
      await api.post(`/vendor-items/vendor/${selectedVendor.id}/item/${item.item_id}/${action}`, {});
      await fetchCatalog();
    } catch (e) {
      alert(e.response?.data?.errors?.[0]?.message || "Gagal");
    }
  };

  const filteredVendors = vendors.filter(v =>
    !vendorSearch || v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.code.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  const sourceTag = (source) => {
    const map = {
      po: { cls: "bg-blue-100 text-blue-700", label: "PO" },
      gr: { cls: "bg-green-100 text-green-700", label: "GR" },
      manual: { cls: "bg-purple-100 text-purple-700", label: "Manual" },
    };
    const t = map[source] || { cls: "bg-gray-100 text-gray-600", label: source };
    return <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${t.cls}`}>{t.label}</span>;
  };

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Item Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Harga aktual per vendor — diupdate otomatis dari PO & GR
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchVendors(); fetchCatalog(); }}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Vendor List */}
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                Daftar Vendor
              </CardTitle>
              <Input
                placeholder="Cari vendor..."
                className="mt-2 h-8 text-sm"
                value={vendorSearch}
                onChange={e => setVendorSearch(e.target.value)}
              />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-y-auto max-h-[600px]">
                {vendorLoading ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Memuat...</div>
                ) : filteredVendors.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm">Tidak ada vendor</div>
                ) : filteredVendors.map(v => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVendor(v); setCatalogPage(1); setCatalogSearch(""); }}
                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${
                      selectedVendor?.id === v.id
                        ? "bg-blue-50 border-r-2 border-r-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">{v.name}</div>
                    <div className="text-xs text-gray-400">{v.code}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Catalog */}
        <div className="col-span-3">
          {!selectedVendor ? (
            <Card className="h-64 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <div className="text-sm">Pilih vendor di sebelah kiri</div>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedVendor.name}</CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {catalogMeta.total || 0} item terlacak
                      {selectedVendor.phone && ` · ${selectedVendor.phone}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Cari item..."
                      className="h-8 w-48 text-sm"
                      value={catalogSearch}
                      onChange={e => { setCatalogSearch(e.target.value); setCatalogPage(1); }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Item</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Harga Aktual</TableHead>
                      <TableHead className="text-right">Harga Ref. Market</TableHead>
                      <TableHead className="text-center">Deviasi</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Sumber Terakhir</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">Memuat...</TableCell></TableRow>
                    ) : catalog.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-12 text-gray-400">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <div className="text-sm">Belum ada item di katalog vendor ini</div>
                        <div className="text-xs mt-1">Data akan otomatis terisi saat PO/GR dibuat</div>
                      </TableCell></TableRow>
                    ) : catalog.map(item => (
                      <TableRow
                        key={item.id}
                        className={item.availability_status === "unavailable" ? "bg-red-50 opacity-80" : "hover:bg-gray-50"}
                      >
                        <TableCell>
                          <div className="font-medium text-sm">{item.item_name}</div>
                          <div className="text-xs text-gray-400">{item.item_code}</div>
                        </TableCell>
                        <TableCell><span className="text-xs text-gray-500">{item.category_name || "-"}</span></TableCell>
                        <TableCell><span className="text-sm">{item.unit}</span></TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-gray-900">
                            {item.current_price > 0 ? `Rp ${fmt(item.current_price)}` : "-"}
                          </span>
                          {item.last_gr_date && (
                            <div className="text-xs text-green-600">dari GR {item.last_gr_date}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.ref_price ? (
                            <span className="text-gray-500 text-sm">Rp {fmt(item.ref_price)}</span>
                          ) : <span className="text-gray-300 text-xs">-</span>}
                          {item.ref_quarter_label && <div className="text-xs text-gray-400">{item.ref_quarter_label}</div>}
                        </TableCell>
                        <TableCell className="text-center">
                          <DeviationBadge pct={item.deviation_pct} />
                        </TableCell>
                        <TableCell className="text-center">
                          <AvailBadge status={item.availability_status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {item.last_po_no && sourceTag("po")}
                            {item.last_gr_no && sourceTag("gr")}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {item.last_gr_date || item.last_po_date || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => openHistory(item)}
                              title="Histori Harga"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => toggleAvailability(item)}
                              title={item.availability_status === "available" ? "Tandai Tidak Tersedia" : "Tandai Tersedia"}
                              className={item.availability_status === "available" ? "text-gray-500 hover:text-red-500" : "text-red-500 hover:text-green-500"}
                            >
                              {item.availability_status === "available"
                                ? <XCircle className="h-4 w-4" />
                                : <CheckCircle className="h-4 w-4" />
                              }
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">{catalogMeta.total || 0} item</div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={catalogPage <= 1} onClick={() => setCatalogPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={catalogPage * 30 >= (catalogMeta.total || 0)} onClick={() => setCatalogPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Price History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Histori Harga: {selectedVendorItem?.item_name}
              <span className="text-sm font-normal text-gray-500 ml-2">@ {selectedVendor?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {priceHistory.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Belum ada histori perubahan harga</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Harga Lama</TableHead>
                    <TableHead className="text-right">Harga Baru</TableHead>
                    <TableHead className="text-center">Perubahan</TableHead>
                    <TableHead>Sumber</TableHead>
                    <TableHead>Dokumen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceHistory.map((h, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-sm">{h.effective_date}</TableCell>
                      <TableCell className="text-right text-gray-500 text-sm">
                        {h.old_price > 0 ? `Rp ${fmt(h.old_price)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">Rp {fmt(h.new_price)}</TableCell>
                      <TableCell className="text-center">
                        {h.change_pct != null ? (
                          <span className={`text-xs font-semibold ${h.change_pct > 0 ? "text-red-600" : h.change_pct < 0 ? "text-green-600" : "text-gray-500"}`}>
                            {h.change_pct > 0 ? "+" : ""}{h.change_pct?.toFixed(1)}%
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          h.source === "gr" ? "bg-green-100 text-green-700" :
                          h.source === "po" ? "bg-blue-100 text-blue-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>{h.source?.toUpperCase()}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-gray-500">{h.source_doc_no || "-"}</span>
                      </TableCell>
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
