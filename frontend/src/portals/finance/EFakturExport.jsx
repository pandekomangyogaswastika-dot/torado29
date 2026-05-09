/** e-Faktur / Coretax Export — Sprint 1b */
import { useState, useEffect } from "react";
import { FileText, Download, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatCurrency, formatDateID } from "@/lib/format";

export default function EFakturExport() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [jobType, setJobType] = useState("keluaran");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exports, setExports] = useState([]);
  const [lastExport, setLastExport] = useState(null);

  useEffect(() => {
    loadExports();
  }, []);

  const loadExports = async () => {
    try {
      const res = await api.get("/efaktur/exports", { params: { per_page: 10 } });
      if (res.data.success) {
        setExports(res.data.data.items);
      }
    } catch (err) {
      console.error("Failed to load export history", err);
    }
  };

  const loadPreview = async () => {
    setLoading(true);
    try {
      const res = await api.get("/efaktur/preview", { params: { period, job_type: jobType } });
      if (res.data.success) {
        setPreview(res.data.data);
        toast.success(`Preview loaded: ${res.data.data.keluaran.length + res.data.data.masukan.length} faktur`);
      }
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || "Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  const generateExport = async () => {
    setExporting(true);
    try {
      const res = await api.post("/efaktur/export", { period, job_type: jobType });
      if (res.data.success) {
        const job = res.data.data;
        setLastExport(job);
        toast.success(`Export berhasil! ${job.faktur_count} faktur`);
        loadExports();
      }
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.message || "Failed to generate export");
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = (format, type) => {
    if (!lastExport || !lastExport.files) {
      toast.error("No export files available");
      return;
    }
    const key = `${format}_${type}`;
    const content = lastExport.files[key];
    if (!content) {
      toast.error(`File ${key} not found`);
      return;
    }
    const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_${period}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${type}_${period}.${format}`);
  };

  return (
    <div className="space-y-6" data-testid="efaktur-export">
      <div>
        <h2 className="text-2xl font-semibold">e-Faktur / Coretax Export</h2>
        <p className="text-muted-foreground">Export Faktur Pajak (CSV + XML) untuk upload ke DJP</p>
      </div>

      <Card data-testid="export-form-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Export
          </CardTitle>
          <CardDescription>
            Pilih periode dan tipe faktur, lalu preview sebelum generate export files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Periode</Label>
              <Input
                id="period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                data-testid="period-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-type">Tipe Faktur</Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger id="job-type" data-testid="job-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keluaran">Faktur Keluaran (Penjualan)</SelectItem>
                  <SelectItem value="masukan">Faktur Masukan (Pembelian)</SelectItem>
                  <SelectItem value="all">Keduanya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadPreview} disabled={loading} data-testid="preview-btn">
              {loading ? "Loading..." : "Preview"}
            </Button>
            <Button
              onClick={generateExport}
              disabled={exporting || !preview}
              variant="default"
              data-testid="generate-btn"
            >
              {exporting ? "Generating..." : "Generate Export"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview && (
        <Card data-testid="preview-card">
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
            <CardDescription>
              Total: {preview.keluaran.length + preview.masukan.length} faktur | DPP: {formatCurrency(preview.total_dpp)} | PPN: {formatCurrency(preview.total_ppn)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="keluaran">
              <TabsList>
                <TabsTrigger value="keluaran">Keluaran ({preview.keluaran.length})</TabsTrigger>
                <TabsTrigger value="masukan">Masukan ({preview.masukan.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="keluaran" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No Faktur</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Pembeli</TableHead>
                      <TableHead className="text-right">DPP</TableHead>
                      <TableHead className="text-right">PPN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.keluaran.slice(0, 10).map((f, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{f.faktur_no}</TableCell>
                        <TableCell>{formatDateID(f.tanggal_faktur)}</TableCell>
                        <TableCell className="truncate max-w-xs">{f.nama_pembeli}</TableCell>
                        <TableCell className="text-right">{formatCurrency(f.dpp)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(f.ppn)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {preview.keluaran.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">...dan {preview.keluaran.length - 10} lainnya</p>
                )}
              </TabsContent>
              <TabsContent value="masukan" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No Faktur</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Penjual</TableHead>
                      <TableHead className="text-right">DPP</TableHead>
                      <TableHead className="text-right">PPN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.masukan.slice(0, 10).map((f, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{f.faktur_no}</TableCell>
                        <TableCell>{formatDateID(f.tanggal_faktur)}</TableCell>
                        <TableCell className="truncate max-w-xs">{f.nama_penjual}</TableCell>
                        <TableCell className="text-right">{formatCurrency(f.dpp)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(f.ppn)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {preview.masukan.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">...dan {preview.masukan.length - 10} lainnya</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {lastExport && (
        <Alert data-testid="download-alert">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Export berhasil dibuat!</div>
            <div className="flex gap-2 flex-wrap">
              {lastExport.job_type !== "masukan" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => downloadFile("csv", "keluaran")} data-testid="download-csv-keluaran">
                    <Download className="h-3 w-3 mr-1" /> CSV Keluaran
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadFile("xml", "keluaran")} data-testid="download-xml-keluaran">
                    <Download className="h-3 w-3 mr-1" /> XML Keluaran
                  </Button>
                </>
              )}
              {lastExport.job_type !== "keluaran" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => downloadFile("csv", "masukan")} data-testid="download-csv-masukan">
                    <Download className="h-3 w-3 mr-1" /> CSV Masukan
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadFile("xml", "masukan")} data-testid="download-xml-masukan">
                    <Download className="h-3 w-3 mr-1" /> XML Masukan
                  </Button>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card data-testid="export-history-card">
        <CardHeader>
          <CardTitle>Riwayat Export</CardTitle>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Belum ada export</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Total DPP</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>{exp.period}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{exp.job_type}</Badge>
                    </TableCell>
                    <TableCell>{exp.faktur_count}</TableCell>
                    <TableCell>{formatCurrency(exp.total_dpp)}</TableCell>
                    <TableCell>{new Date(exp.created_at).toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
