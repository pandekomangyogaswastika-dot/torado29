import { useEffect, useState, useCallback } from "react";
import { Receipt, ToggleLeft, ToggleRight, Calculator, ChevronDown, ChevronRight,
         AlertTriangle, CheckCircle2, Info, RefreshCw, TrendingDown, FileDown } from "lucide-react";
import api, { unwrap } from "@/lib/api";
import { fmtRp, fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import LoadingState from "@/components/shared/LoadingState";

// ───── helpers ────────────────────────────────────────────────────────
const TABS = [
  { id: "ppn",   label: "PPN",      icon: Receipt,     color: "blue"   },
  { id: "pph21", label: "PPh 21",   icon: TrendingDown, color: "purple" },
  { id: "pph23", label: "PPh 23",   icon: Calculator,   color: "amber"  },
  { id: "pph42", label: "PPh 4(2)", icon: Receipt,      color: "rose"   },
];

const PPH_LABELS = {
  ppn:   { full: "PPN (Pajak Pertambahan Nilai)",         law: "Perpu 2/2024 — efektif 2025" },
  pph21: { full: "PPh Pasal 21 (Karyawan)",               law: "UU HPP No. 7/2021" },
  pph23: { full: "PPh Pasal 23 (Jasa/Royalti)",           law: "UU PPh" },
  pph42: { full: "PPh Pasal 4 Ayat 2 (Final)",            law: "UU PPh" },
};

const colMap = {
  blue:   "bg-blue-50 border-blue-200 text-blue-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  amber:  "bg-amber-50 border-amber-200 text-amber-700",
  rose:   "bg-rose-50 border-rose-200 text-rose-700",
};

const badgeColor = {
  blue:   "bg-blue-100 text-blue-700 border-blue-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  amber:  "bg-amber-100 text-amber-700 border-amber-200",
  rose:   "bg-rose-100 text-rose-700 border-rose-200",
};

function fmtRpShort(n) {
  if (!n && n !== 0) return "-";
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n/1_000_000).toFixed(2)}jt`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n/1_000).toFixed(0)}rb`;
  return `Rp ${n.toFixed(0)}`;
}

// ───── ToggleSwitch ────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, color = "blue", disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none",
        checked
          ? (color === "blue" ? "bg-blue-500" : color === "purple" ? "bg-purple-500" : color === "amber" ? "bg-amber-500" : "bg-rose-500")
          : "bg-gray-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className={cn(
        "inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300",
        checked ? "translate-x-8" : "translate-x-1"
      )} />
    </button>
  );
}

// ───── RateInput ────────────────────────────────────────────────────────────
function RateInput({ label, keyName, value, onChange, pctDisplay, disabled, hint }) {
  const [local, setLocal] = useState(String(value || ""));

  useEffect(() => { setLocal(String(value || "")); }, [value]);

  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number" step="0.001" min="0" max="1"
          value={local}
          onChange={e => setLocal(e.target.value)}
          onBlur={() => { const v = parseFloat(local); if (!isNaN(v)) onChange(keyName, v); }}
          disabled={disabled}
          className="w-32 tabular-nums"
        />
        <span className="text-sm font-semibold text-gray-600">
          = {pctDisplay !== undefined ? pctDisplay : `${(parseFloat(local||0)*100).toFixed(1)}%`}
        </span>
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ───── PPh21 Calculator Widget ─────────────────────────────────────────────────
function PPh21Calculator() {
  const [monthly, setMonthly] = useState("");
  const [ptkp, setPtkp] = useState("TK/0");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const PTKP_OPTIONS = [
    "TK/0", "TK/1", "TK/2", "TK/3",
    "K/0",  "K/1",  "K/2",  "K/3",
    "K/I/0","K/I/1","K/I/2","K/I/3",
  ];

  async function calculate() {
    if (!monthly || isNaN(parseFloat(monthly))) return;
    setLoading(true);
    try {
      const calcRes1 = await api.post("/tax/calculate", {
        tax_type: "pph21",
        gross_amount: parseFloat(monthly),
        monthly_gross: parseFloat(monthly),
        ptkp_status: ptkp,
      });
      setResult(unwrap(calcRes1));
    } catch(e) {
      toast.error("Gagal kalkulasi: " + (e.message || "Error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 space-y-4">
      <h4 className="font-semibold text-purple-800 flex items-center gap-2">
        <Calculator size={16} /> Kalkulator PPh 21 (Preview)
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-purple-700">Gaji Bulanan (Rp)</Label>
          <Input
            type="number" min="0" placeholder="5000000"
            value={monthly} onChange={e => setMonthly(e.target.value)}
            className="border-purple-200"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-purple-700">Status PTKP</Label>
          <select
            value={ptkp} onChange={e => setPtkp(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-purple-200 text-sm bg-white"
          >
            {PTKP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <Button onClick={calculate} disabled={loading} size="sm" variant="outline"
        className="border-purple-300 text-purple-700 hover:bg-purple-100">
        {loading ? <RefreshCw size={14} className="animate-spin mr-1" /> : <Calculator size={14} className="mr-1" />}
        Hitung
      </Button>
      {result && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200">
          {[
            ["Annual Gross",   fmtRp(result.annual_gross)],
            ["PTKP",           fmtRp(result.ptkp_annual)],
            ["PKP (kena pajak)",fmtRp(result.annual_pkp)],
            ["PPh 21 Tahunan", fmtRp(result.annual_tax)],
            ["PPh 21/bulan",   fmtRp(result.monthly_tax)],
            ["Effective Rate", `${result.effective_rate}%`],
          ].map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="text-gray-500">{k}: </span>
              <span className="font-semibold text-purple-800">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───── PPh Calc Preview (PPh23/PPh42) ─────────────────────────────────────────
function WithholdingCalcPreview({ taxType, serviceTypes, defaultService }) {
  const color = taxType === "pph23" ? "amber" : "rose";
  const [gross, setGross] = useState("");
  const [stype, setStype] = useState(defaultService || (serviceTypes[0]?.code ?? ""));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    if (!gross || isNaN(parseFloat(gross))) return;
    setLoading(true);
    try {
      const calcRes2 = await api.post("/tax/calculate", {
        tax_type: taxType,
        gross_amount: parseFloat(gross),
        service_type: stype,
      });
      setResult(unwrap(calcRes2));
    } catch(e) {
      toast.error("Gagal: " + (e.message || "Error"));
    } finally {
      setLoading(false);
    }
  }

  const borderCol = color === "amber" ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50";
  const headCol  = color === "amber" ? "text-amber-800" : "text-rose-800";
  const btnCol   = color === "amber"
    ? "border-amber-300 text-amber-700 hover:bg-amber-100"
    : "border-rose-300 text-rose-700 hover:bg-rose-100";
  const divCol   = color === "amber" ? "border-amber-200" : "border-rose-200";

  return (
    <div className={cn("rounded-xl border p-4 space-y-4", borderCol)}>
      <h4 className={cn("font-semibold flex items-center gap-2", headCol)}>
        <Calculator size={16} /> Kalkulator {taxType === "pph23" ? "PPh 23" : "PPh 4(2)"}
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Jumlah Bruto (Rp)</Label>
          <Input type="number" min="0" placeholder="10000000"
            value={gross} onChange={e => setGross(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Jenis Transaksi</Label>
          <select value={stype} onChange={e => setStype(e.target.value)}
            className="w-full h-9 px-3 rounded-md border text-sm bg-white">
            {serviceTypes.map(s => <option key={s.code} value={s.code}>{s.label} ({(s.rate*100).toFixed(0)}%)</option>)}
          </select>
        </div>
      </div>
      <Button onClick={calculate} disabled={loading} size="sm" variant="outline" className={btnCol}>
        {loading ? <RefreshCw size={14} className="animate-spin mr-1" /> : <Calculator size={14} className="mr-1" />}
        Hitung
      </Button>
      {result && result.enabled !== false && (
        <div className={cn("grid grid-cols-3 gap-2 pt-2 border-t text-sm", divCol)}>
          {[
            ["Bruto", fmtRp(result.gross_amount)],
            ["PPh Dipotong", fmtRp(result.wh_amount)],
            ["Net Dibayar", fmtRp(result.net_amount)],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-gray-500 text-xs">{k}</div>
              <div className="font-semibold">{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───── BracketsTable ────────────────────────────────────────────────────────────
function BracketsTable({ brackets }) {
  const [open, setOpen] = useState(false);
  if (!brackets?.length) return null;
  return (
    <div className="border border-purple-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 text-sm font-medium text-purple-800 transition-colors"
      >
        <span>Tabel Tarif PPh 21 Progresif (UU HPP No. 7/2021)</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Rentang PKP</th>
                <th className="px-4 py-2 text-right">Tarif</th>
              </tr>
            </thead>
            <tbody>
              {brackets.map((b, i) => (
                <tr key={i} className={cn("border-t", i % 2 === 0 ? "bg-white" : "bg-purple-50/30")}>
                  <td className="px-4 py-2">
                    {b.lower === 0 ? "s.d." : `> ${fmtRp(b.lower)} –`} {b.upper ? fmtRp(b.upper) : "tak terbatas"}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-purple-700">{b.rate_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───── WithholdingSummaryTable ────────────────────────────────────────────────
function WithholdingSummaryTable({ year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/tax/withholding/summary", { params: { year } })
      .then(res => setRows(unwrap(res) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="py-4 text-center text-sm text-gray-400">Memuat...</div>;
  if (!rows.length) return <p className="text-sm text-gray-400 py-4 text-center">Belum ada transaksi withholding.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            {["Periode","Jenis PPh","#Transaksi","Bruto","PPh Dipotong","Net"].map(h => (
              <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono">{r.period}</td>
              <td className="px-3 py-2">
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                  r.wh_type === "pph21" ? "bg-purple-100 text-purple-700" :
                  r.wh_type === "pph23" ? "bg-amber-100 text-amber-700" :
                  "bg-rose-100 text-rose-700")
                }>{r.wh_type_label}</span>
              </td>
              <td className="px-3 py-2 text-center">{r.count}</td>
              <td className="px-3 py-2 tabular-nums">{fmtRp(r.gross_total)}</td>
              <td className="px-3 py-2 tabular-nums text-red-600 font-medium">{fmtRp(r.wh_total)}</td>
              <td className="px-3 py-2 tabular-nums text-green-700 font-medium">{fmtRp(r.net_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───── ServiceTypeList ────────────────────────────────────────────────────────────
function ServiceTypeList({ types, color }) {
  const badge = color === "amber" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
  const border = color === "amber" ? "border-amber-100" : "border-rose-100";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className={cn("text-xs text-gray-500 uppercase", border)}>
          <tr>
            <th className="px-3 py-2 text-left">Kode</th>
            <th className="px-3 py-2 text-left">Jenis</th>
            <th className="px-3 py-2 text-right">Tarif</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {types.map(t => (
            <tr key={t.code} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono text-xs">{t.code}</td>
              <td className="px-3 py-2">{t.label}</td>
              <td className="px-3 py-2 text-right">
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", badge)}>
                  {(t.rate * 100).toFixed(0)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───── MAIN TaxCenter ────────────────────────────────────────────────────────────
export default function TaxCenter() {
  const [activeTab, setActiveTab] = useState("ppn");
  const [config, setConfig] = useState(null);
  const [types, setTypes] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localRates, setLocalRates] = useState({});
  const curYear = String(new Date().getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, typesRes] = await Promise.all([
        api.get("/tax/config"),
        api.get("/tax/types"),
      ]);
      const cfg = unwrap(cfgRes);
      const t = unwrap(typesRes);
      setConfig(cfg);
      setTypes(t);
      setLocalRates({
        TAX_PPN_RATE:  cfg.ppn.rate,
        TAX_PPH23_RATE: cfg.pph23.rate,
        TAX_PPH42_RATE: cfg.pph42.rate,
      });
    } catch(e) {
      toast.error("Gagal memuat konfigurasi pajak");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleEnabled(taxType, enabled) {
    const keyMap = { ppn: "TAX_PPN_ENABLED", pph21: "TAX_PPH21_ENABLED", pph23: "TAX_PPH23_ENABLED", pph42: "TAX_PPH42_ENABLED" };
    setSaving(true);
    try {
      const toggleRes = await api.put("/tax/config", { [keyMap[taxType]]: String(enabled) });
      unwrap(toggleRes);
      toast.success(`${taxType.toUpperCase()} ${enabled ? "diaktifkan" : "dinonaktifkan"}`);
      await load();
    } catch(e) {
      toast.error("Gagal update: " + (e.message || ""));
    } finally {
      setSaving(false);
    }
  }

  async function saveRate(keyName, value) {
    setSaving(true);
    try {
      const saveRateRes = await api.put("/tax/config", { [keyName]: String(value) }); unwrap(saveRateRes);
      toast.success(`Tarif diperbarui → ${(value*100).toFixed(1)}%`);
      await load();
    } catch(e) {
      toast.error("Gagal: " + (e.message || ""));
    } finally {
      setSaving(false);
    }
  }

  async function saveMethod(method) {
    setSaving(true);
    try {
      const saveMethodRes = await api.put("/tax/config", { TAX_PPH21_METHOD: method }); unwrap(saveMethodRes);
      toast.success(`Metode PPh 21 → ${method}`);
      await load();
    } catch(e) {
      toast.error("Gagal: " + (e.message || ""));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState rows={4} />;
  if (!config) return null;

  const activeInfo = TABS.find(t => t.id === activeTab);
  const color = activeInfo?.color || "blue";

  return (
    <div className="space-y-6 pb-8">
      {/* Header banner */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pusat Pajak</h2>
            <p className="text-gray-300 text-sm mt-1">Konfigurasi PPN, PPh 21/23/4(2) — Sprint 1 Compliance Indonesia 2026</p>
          </div>
          <div className="flex gap-3">
            {TABS.map(t => (
              <div key={t.id} className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                badgeColor[t.color],
                config[t.id]?.enabled
                  ? "opacity-100"
                  : "opacity-40 line-through"
              )}>
                {t.label}: {config[t.id]?.enabled ? "ON" : "OFF"}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {TABS.map(t => {
          const Icon = t.Icon || Receipt;
          const enabled = config[t.id]?.enabled;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition-all border border-b-0",
                activeTab === t.id
                  ? cn(colMap[t.color], "border-current")
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                enabled ? (t.color === "blue" ? "bg-blue-500" : t.color === "purple" ? "bg-purple-500" : t.color === "amber" ? "bg-amber-500" : "bg-rose-500") : "bg-gray-300"
              )} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* PPN Panel */}
      {activeTab === "ppn" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-blue-200 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{PPH_LABELS.ppn.full}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{PPH_LABELS.ppn.law}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-sm font-medium", config.ppn.enabled ? "text-blue-700" : "text-gray-400")}>
                  {config.ppn.enabled ? "Aktif" : "Nonaktif"}
                </span>
                <ToggleSwitch
                  checked={config.ppn.enabled}
                  onChange={(v) => toggleEnabled("ppn", v)}
                  color="blue"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <RateInput
                label="Tarif PPN" keyName="TAX_PPN_RATE"
                value={localRates.TAX_PPN_RATE}
                onChange={(k, v) => { setLocalRates(p => ({...p, [k]: v})); saveRate(k, v); }}
                pctDisplay={`${(parseFloat(localRates.TAX_PPN_RATE||0.12)*100).toFixed(0)}%`}
                disabled={!config.ppn.enabled || saving}
                hint="Default: 0.12 (12%) sesuai Perpu 2/2024"
              />
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">PPN 12% berlaku efektif 1 Jan 2025</p>
                    <p className="text-blue-600 mt-1">Sebelumnya 11% (UU HPP). Diubah menjadi 12% via Perpu 2/2024.</p>
                    <p className="text-blue-600 mt-1">Tarif ini otomatis digunakan di form Daily Sales, GR, dan Payment.</p>
                  </div>
                </div>
              </div>
            </div>

            {!config.ppn.enabled && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <AlertTriangle size={16} />
                <span>PPN dinonaktifkan. Semua transaksi baru <b>tidak</b> akan dikenakan PPN hingga diaktifkan kembali.</span>
              </div>
            )}
          </div>
          <div className="rounded-2xl border bg-white p-6">
            <h4 className="font-semibold mb-4">Riwayat Withholding</h4>
            <WithholdingSummaryTable year={curYear} />
          </div>
        </div>
      )}

      {/* PPh 21 Panel */}
      {activeTab === "pph21" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-purple-200 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{PPH_LABELS.pph21.full}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{PPH_LABELS.pph21.law}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-sm font-medium", config.pph21.enabled ? "text-purple-700" : "text-gray-400")}>
                  {config.pph21.enabled ? "Aktif" : "Nonaktif"}
                </span>
                <ToggleSwitch checked={config.pph21.enabled} onChange={v => toggleEnabled("pph21", v)} color="purple" disabled={saving} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label>Metode Perhitungan</Label>
                <div className="flex gap-3">
                  {[
                    { v: "gross",    label: "Gross",    desc: "Pajak ditanggung karyawan (dipotong gaji)" },
                    { v: "gross_up", label: "Gross-Up",  desc: "Pajak ditanggung perusahaan (jadi biaya)" },
                  ].map(m => (
                    <button
                      key={m.v}
                      onClick={() => saveMethod(m.v)}
                      disabled={!config.pph21.enabled || saving}
                      className={cn(
                        "flex-1 rounded-xl border p-3 text-sm text-left transition-all",
                        config.pph21.method === m.v
                          ? "border-purple-400 bg-purple-50 text-purple-800 font-medium"
                          : "border-gray-200 hover:border-gray-300 text-gray-600",
                        (!config.pph21.enabled || saving) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="font-semibold">{m.label}</div>
                      <div className="text-xs mt-0.5 opacity-70">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-purple-800">
                    <p className="font-medium">PPh 21 dipotong dari payroll</p>
                    <p className="text-purple-600 mt-1">Saat payroll diproses, sistem otomatis menghitung PPh 21 per karyawan berdasarkan status PTKP dan gaji pokok.</p>
                    <p className="text-purple-600 mt-1">JE: Dr Beban Gaji / Cr Gaji Bersih + Cr Utang PPh 21</p>
                  </div>
                </div>
              </div>
            </div>

            <BracketsTable brackets={config.pph21.brackets} />
          </div>

          <PPh21Calculator />

          {/* e-SPT PPh21 Export (Sprint G) */}
          <PPh21SPTExport />

          <div className="rounded-2xl border bg-white p-6">
            <h4 className="font-semibold mb-4">Riwayat PPh 21 (Payroll)</h4>
            <WithholdingSummaryTable year={curYear} />
          </div>
        </div>
      )}

      {/* PPh 23 Panel */}
      {activeTab === "pph23" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{PPH_LABELS.pph23.full}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{PPH_LABELS.pph23.law}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-sm font-medium", config.pph23.enabled ? "text-amber-700" : "text-gray-400")}>
                  {config.pph23.enabled ? "Aktif" : "Nonaktif"}
                </span>
                <ToggleSwitch checked={config.pph23.enabled} onChange={v => toggleEnabled("pph23", v)} color="amber" disabled={saving} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <RateInput
                label="Tarif Default PPh 23" keyName="TAX_PPH23_RATE"
                value={localRates.TAX_PPH23_RATE}
                onChange={(k, v) => { setLocalRates(p => ({...p, [k]: v})); saveRate(k, v); }}
                disabled={!config.pph23.enabled || saving}
                hint="Rate per jenis transaksi lihat tabel kanan"
              />
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Dipotong saat bayar vendor</p>
                    <p className="text-amber-700 mt-1">Aktifkan per payment di form Pembayaran. Pilih "Jenis PPh 23" dan sistem otomatis memotong dan membuat JE ke Utang PPh 23.</p>
                    <p className="text-amber-700 mt-1">JE: Dr Beban / Cr Bank (net) + Cr Utang PPh 23</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Jenis Transaksi &amp; Tarif</h4>
              <ServiceTypeList types={types.pph23_service_types || []} color="amber" />
            </div>
          </div>

          <WithholdingCalcPreview
            taxType="pph23"
            serviceTypes={types.pph23_service_types || []}
            defaultService="jasa"
          />

          <div className="rounded-2xl border bg-white p-6">
            <h4 className="font-semibold mb-4">Riwayat PPh 23</h4>
            <WithholdingSummaryTable year={curYear} />
          </div>
        </div>
      )}

      {/* PPh 4(2) Panel */}
      {activeTab === "pph42" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-rose-200 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{PPH_LABELS.pph42.full}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{PPH_LABELS.pph42.law}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-sm font-medium", config.pph42.enabled ? "text-rose-700" : "text-gray-400")}>
                  {config.pph42.enabled ? "Aktif" : "Nonaktif"}
                </span>
                <ToggleSwitch checked={config.pph42.enabled} onChange={v => toggleEnabled("pph42", v)} color="rose" disabled={saving} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <RateInput
                label="Tarif Default PPh 4(2)" keyName="TAX_PPH42_RATE"
                value={localRates.TAX_PPH42_RATE}
                onChange={(k, v) => { setLocalRates(p => ({...p, [k]: v})); saveRate(k, v); }}
                disabled={!config.pph42.enabled || saving}
                hint="Default: 0.10 (10%) untuk sewa bangunan"
              />
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Pajak final — tidak dapat dikreditkan</p>
                    <p className="text-rose-700 mt-1">PPh 4(2) adalah pajak final. Berlaku untuk sewa tanah/bangunan, jasa konstruksi, dll.</p>
                    <p className="text-rose-700 mt-1">JE: Dr Beban Sewa / Cr Bank (net) + Cr Utang PPh 4(2)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Jenis &amp; Tarif PPh 4(2)</h4>
              <ServiceTypeList types={types.pph42_service_types || []} color="rose" />
            </div>
          </div>

          <WithholdingCalcPreview
            taxType="pph42"
            serviceTypes={types.pph42_service_types || []}
            defaultService="sewa_bangunan"
          />

          <div className="rounded-2xl border bg-white p-6">
            <h4 className="font-semibold mb-4">Riwayat PPh 4(2)</h4>
            <WithholdingSummaryTable year={curYear} />
          </div>
        </div>
      )}
    </div>
  );
}


// ── PPh21 e-SPT Export Panel (Sprint G) ───────────────────────────────────────
function PPh21SPTExport() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/tax/pph21/summary`, { params: { period } });
      setSummary(unwrap(r));
    } catch { } finally { setLoading(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const r = await api.get(`/tax/pph21/spt-export`, {
        params: { period },
        responseType: "blob",
      });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SPT_PPh21_Masa_${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Gagal mengunduh: " + (e.message || "Unknown error"));
    } finally { setDownloading(false); }
  };

  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileDown size={18} className="text-purple-600" />
        <h4 className="font-semibold text-purple-900">Export SPT Masa PPh 21</h4>
      </div>
      <p className="text-sm text-purple-700 mb-4">
        Export data pemotongan PPh 21 dari payroll cycle dalam format CSV (kompatibel e-SPT DJP).
      </p>
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1">
          <label className="text-xs text-purple-700 font-medium">Periode</label>
          <input
            type="month"
            value={period}
            onChange={e => { setPeriod(e.target.value); setSummary(null); }}
            className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <Button variant="outline" size="sm" onClick={loadSummary} disabled={loading} className="border-purple-300">
          {loading ? <RefreshCw size={14} className="animate-spin mr-1" /> : null}
          Lihat Summary
        </Button>
        <Button size="sm" onClick={handleDownload} disabled={downloading}
                className="bg-purple-600 hover:bg-purple-700 text-white">
          {downloading ? <RefreshCw size={14} className="animate-spin mr-1" /> : <FileDown size={14} className="mr-1" />}
          Download CSV
        </Button>
      </div>
      {summary && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{summary.total_employees}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Karyawan</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{summary.employees_with_pph21}</div>
            <div className="text-xs text-gray-500 mt-0.5">Wajib Potong PPh 21</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-purple-700">{fmtRp(summary.total_pph21)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total PPh 21 Setor</div>
          </div>
        </div>
      )}
    </div>
  );
}
