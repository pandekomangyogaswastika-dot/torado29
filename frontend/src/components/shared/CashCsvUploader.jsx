/**
 * CashCsvUploader — upload CSV with columns: account_code,balance,recorded_at(opt),notes(opt)
 * Shows preview on success, errors per row.
 * Phase 11B.
 */
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { fmtRp } from "@/lib/format";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TEMPLATE = "account_code,balance,recorded_at,notes\nBANK-BCA-OPS,500000000,,Saldo akhir bulan\nPC-ALT,4500000,,\n";

export default function CashCsvUploader({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/finance/cash/upload-csv", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data?.data;
      setResult(data);
      if (data.updated > 0) {
        toast.success(`${data.updated} akun di-update`);
      } else if (data.errors?.length) {
        toast.warning("Tidak ada akun di-update, lihat detail error");
      }
    } catch (e) {
      toast.error(e?.response?.data?.errors?.[0]?.message || "Upload gagal");
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cash_balance_template.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Upload Cash Balance CSV
          </DialogTitle>
        </DialogHeader>

        {!result && (
          <>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Format: <code className="text-foreground">account_code,balance,recorded_at(opt),notes(opt)</code>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1">
                <Download className="h-3 w-3" /> Download Template
              </Button>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-sm"
                />
                {file && (
                  <div className="mt-2 text-xs font-medium">{file.name} ({(file.size / 1024).toFixed(1)} KB)</div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Batal</Button>
              <Button onClick={upload} disabled={!file || busy}>
                {busy ? "Memproses…" : "Upload & Apply"}
              </Button>
            </DialogFooter>
          </>
        )}

        {result && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="glass-card p-3 text-center">
                <div className="text-xs text-muted-foreground">Updated</div>
                <div className="text-2xl font-bold text-emerald-600">{result.updated}</div>
              </div>
              <div className="glass-card p-3 text-center">
                <div className="text-xs text-muted-foreground">Skipped</div>
                <div className="text-2xl font-bold text-amber-600">{result.skipped}</div>
              </div>
              <div className="glass-card p-3 text-center">
                <div className="text-xs text-muted-foreground">Errors</div>
                <div className="text-2xl font-bold text-rose-600">{result.errors?.length || 0}</div>
              </div>
            </div>
            {result.rows?.length > 0 && (
              <div className="max-h-48 overflow-y-auto mb-3">
                <table className="w-full text-xs">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr>
                      <th className="py-1.5">Row</th>
                      <th>Code</th>
                      <th className="text-right">Prev</th>
                      <th className="text-right">New</th>
                      <th className="text-right">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r) => (
                      <tr key={r.row} className="border-b last:border-b-0">
                        <td className="py-1">{r.row}</td>
                        <td>{r.code}</td>
                        <td className="text-right font-mono">{fmtRp(r.prev)}</td>
                        <td className="text-right font-mono font-semibold">{fmtRp(r.new)}</td>
                        <td className={cn("text-right font-mono", r.delta > 0 ? "text-emerald-600" : r.delta < 0 ? "text-rose-600" : "")}>
                          {r.delta > 0 ? "+" : ""}{fmtRp(r.delta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {result.errors?.length > 0 && (
              <div className="max-h-32 overflow-y-auto mb-3 bg-rose-50 dark:bg-rose-950/30 p-2 rounded">
                <div className="text-xs font-semibold text-rose-700 mb-1">Errors</div>
                <ul className="text-xs space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-rose-600">Row {e.row}: {e.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => { setResult(null); setFile(null); }}>Upload Lagi</Button>
              <Button variant="default" onClick={onDone}>Selesai</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
