/**
 * e-Bupot PPh 23 Export Page — Sprint E Phase 3
 * Export PPh 23 withholding tax data in DJP e-Bupot CSV format.
 */
import { useState, useEffect } from "react";
import {
  FileSpreadsheet, Download, RefreshCw, AlertCircle,
  CheckCircle2, Eye, Calendar, Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatCurrency, formatDateID } from "@/lib/format";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function getPeriodOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return opts;
}

export default function EBupotExport() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [preview, setPreview] = useState(null);
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("export");

  useEffect(() => { loadExports(); }, []);

  const loadExports = async () => {
    try {
      const res = await api.get("/ebupot/exports");
      setExports(res.data.data || []);
    } catch {}
  };

  const loadPreview = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ebupot/preview", { params: { period } });
      setPreview(res.data.data);
      toast.success(`Preview dimuat: ${res.data.data.row_count} transaksi`);
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || "Gagal memuat preview");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.post("/ebupot/export", { period });
      const job = res.data.data;
      // Download CSV
      const blob = new Blob([job.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eBupot_PPh23_${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`e-Bupot CSV diunduh: ${job.row_count} transaksi`);
      loadExports();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || "Gagal mengekspor");
    } finally {
      setExporting(false);
    }
  };

  const periodOptions = getPeriodOptions();

  return (
    <div className="space-y-6 p-6" data-testid="ebupot-export-page">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">e-Bupot PPh 23</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Export data pemotongan PPh 23 dalam format CSV DJP e-Bupot Unifikasi
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          File CSV ini dapat diimpor langsung ke aplikasi <strong>DJP e-Bupot Unifikasi</strong>.
          Pastikan NPWP perusahaan sudah dikonfigurasi di <strong>Admin → System Settings</strong>.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="preview">Preview Data</TabsTrigger>
          <TabsTrigger value="history">Riwayat ({exports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generate e-Bupot CSV</CardTitle>
              <CardDescription>Pilih periode pajak untuk diekspor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Masa Pajak</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-60">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={loadPreview} disabled={loading}>
                  {loading
                    ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    : <Eye className="h-4 w-4 mr-2" />}
                  Preview
                </Button>
                <Button onClick={handleExport} disabled={exporting} data-testid="ebupot-export-btn">
                  {exporting
                    ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    : <Download className="h-4 w-4 mr-2" />}
                  Download CSV
                </Button>
              </div>

              {preview && (
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                  <p className="text-sm font-semibold">Ringkasan Preview</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Transaksi</p>
                      <p className="text-lg font-bold">{preview.row_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total DPP</p>
                      <p className="text-lg font-bold">{formatCurrency(preview.total_dpp)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total PPh Dipotong</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(preview.total_pph)}</p>
                    </div>
                  </div>
                  {preview.warning_count > 0 && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {preview.warning_count} transaksi memiliki peringatan (NPWP kosong, dll).
                        Periksa tab Preview Data.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Preview Data PPh 23 — {period}</CardTitle>
                <Button size="sm" variant="outline" onClick={loadPreview} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!preview ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Klik "Preview" di tab Export untuk memuat data</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>NPWP</TableHead>
                        <TableHead>Kode Objek</TableHead>
                        <TableHead className="text-right">DPP</TableHead>
                        <TableHead className="text-right">Tarif</TableHead>
                        <TableHead className="text-right">PPh Dipotong</TableHead>
                        <TableHead>Bukti Potong</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(preview.rows || []).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="text-sm font-medium">{row.nama_terpotong}</TableCell>
                          <TableCell className="font-mono text-xs">{row.npwp_terpotong}</TableCell>
                          <TableCell className="text-xs">{row.kode_objek}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(row.dpp)}</TableCell>
                          <TableCell className="text-right text-sm">{row.tarif?.toFixed(1)}%</TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatCurrency(row.pph_dipotong)}</TableCell>
                          <TableCell className="font-mono text-xs">{row.bukti_potong_no}</TableCell>
                          <TableCell>
                            {row.validation_issues?.length > 0 ? (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs gap-1">
                                <AlertCircle className="h-3 w-3" />{row.validation_issues.length} peringatan
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1">
                                <CheckCircle2 className="h-3 w-3" />OK
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {exports.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Belum ada riwayat ekspor</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periode</TableHead>
                      <TableHead className="text-right">Transaksi</TableHead>
                      <TableHead className="text-right">Total PPh</TableHead>
                      <TableHead>Diekspor Oleh</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exports.map(job => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.period}</TableCell>
                        <TableCell className="text-right">{job.row_count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(job.total_pph)}</TableCell>
                        <TableCell className="text-sm">{job.created_by}</TableCell>
                        <TableCell className="text-sm">{job.created_at ? new Date(job.created_at).toLocaleString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
