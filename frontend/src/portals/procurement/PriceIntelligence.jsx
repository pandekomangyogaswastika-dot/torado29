import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../../components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../../components/ui/table";
import {
  TrendingUp, TrendingDown, AlertTriangle, BarChart2, Package,
  RefreshCw, ShieldAlert, CheckCircle, Minus
} from "lucide-react";

const fmt = (n) => n != null ? new Intl.NumberFormat("id-ID").format(n) : "-";

const DevBadge = ({ pct }) => {
  if (pct == null) return <span className="text-gray-400 text-xs">-</span>;
  const cls = pct > 10 ? "bg-red-100 text-red-700" : pct < -10 ? "bg-green-100 text-green-700" : pct > 0 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700";
  const icon = pct > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {icon}{pct > 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
};

export default function PriceIntelligence() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState({ category_id: "", topN: 20 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ top_n: filter.topN, ...(filter.category_id && { category_id: filter.category_id }) });
      const [intRes, catRes] = await Promise.all([
        api.get(`/market-list/intelligence?${params}`),
        api.get("/master/categories?per_page=100"),
      ]);
      setData(intRes.data.data);
      setCategories(catRes.data.data || []);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  const aboveRef = data?.top_deviations?.filter(d => d.deviation_pct > 0).length || 0;
  const belowRef = data?.top_deviations?.filter(d => d.deviation_pct < 0).length || 0;

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">
            Deviasi harga vendor vs harga referensi Market List
            {data?.quarter_label && <span className="ml-1 font-medium text-blue-600">{data.quarter_label}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter.category_id} onValueChange={v => setFilter(f => ({ ...f, category_id: v === "all" ? "" : v }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-700">{data?.total_items_tracked || 0}</div>
            <div className="text-xs text-gray-500">Item Terlacak</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-700">{data?.price_above_reference || 0}</div>
            <div className="text-xs text-gray-500">Harga Di Atas Referensi (&gt;10%)</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-700">{data?.price_below_reference || 0}</div>
            <div className="text-xs text-gray-500">Harga Di Bawah Referensi (&gt;10%)</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-700">{data?.single_source_risk?.length || 0}</div>
            <div className="text-xs text-gray-500">Single-Source Risk</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main deviations table */}
        <div className="col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-blue-600" />
                Deviasi Harga Vendor vs Market List Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Item</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Harga Vendor</TableHead>
                    <TableHead className="text-right">Harga Ref.</TableHead>
                    <TableHead className="text-center">Deviasi</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data?.top_deviations?.length ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-400">
                      <BarChart2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <div>Belum ada data price intelligence</div>
                      <div className="text-xs mt-1">Buat PO atau GR terlebih dahulu agar data vendor terupdate</div>
                    </TableCell></TableRow>
                  ) : data.top_deviations.map((d, idx) => (
                    <TableRow key={idx} className={d.deviation_pct > 10 ? "bg-red-50" : d.deviation_pct < -10 ? "bg-green-50" : "hover:bg-gray-50"}>
                      <TableCell>
                        <div className="font-medium text-sm">{d.item_name}</div>
                        <div className="text-xs text-gray-400">{d.unit}</div>
                      </TableCell>
                      <TableCell><span className="text-xs text-gray-500">{d.category_name || "-"}</span></TableCell>
                      <TableCell><span className="text-sm">{d.vendor_name}</span></TableCell>
                      <TableCell className="text-right font-semibold text-sm">Rp {fmt(d.actual_price)}</TableCell>
                      <TableCell className="text-right text-gray-500 text-sm">Rp {fmt(d.ref_price)}</TableCell>
                      <TableCell className="text-center"><DevBadge pct={d.deviation_pct} /></TableCell>
                      <TableCell className="text-center">
                        {d.availability_status === "unavailable" ? (
                          <Badge variant="outline" className="text-red-600 border-red-300 text-xs">Tidak Tersedia</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-300 text-xs">Tersedia</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Single source risk */}
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-orange-500" />
                Single-Source Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.single_source_risk?.length ? (
                <div className="text-center text-gray-400 py-8">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <div className="text-sm">Semua item punya &gt;1 vendor</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.single_source_risk.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between p-2 bg-orange-50 rounded-lg border border-orange-100">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                        <div className="text-xs text-gray-500">{item.category_name}</div>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">1 vendor</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
