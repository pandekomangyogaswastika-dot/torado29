/** Budget vs Actual — Sprint B (fixed: category_rollup, budget field, link to manage) */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, TrendingDown, Settings2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

export default function BudgetVsActual() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/budget/vs-actual", { params: { period, level: "both" } });
      if (res.data.success) setData(res.data.data);
    } catch { toast.error("Gagal memuat data budget"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [period]);

  const getVarianceColor = (pct, category) => {
    if (pct === null || pct === undefined) return "text-muted-foreground";
    // For revenue, negative variance is bad (under-budget)
    if (category === "REV") return pct < -5 ? "text-red-600" : pct > 5 ? "text-green-600" : "text-gray-600";
    // For expenses, positive variance is bad (over-budget)
    return pct > 10 ? "text-red-600" : pct < -10 ? "text-green-600" : "text-gray-600";
  };

  const hasBudgets = data && (data.category_rollup?.length > 0 || data.coa_level?.some(r => r.budget > 0));

  return (
    <div className="space-y-6" data-testid="budget-vs-actual">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="h-6 w-6" /> Budget vs Actual
          </h2>
          <p className="text-muted-foreground text-sm">Perbandingan budget vs realisasi per periode</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/finance/budget/manage")} data-testid="manage-budgets-btn">
          <Settings2 className="h-4 w-4 mr-2" /> Kelola Budget
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>Periode</Label>
              <Input type="month" value={period} onChange={e => setPeriod(e.target.value)}
                data-testid="period-input" />
            </div>
            <Button onClick={loadData} disabled={loading} data-testid="load-data-btn">
              {loading ? "Loading..." : "Muat Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && !hasBudgets && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <Target className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Belum ada budget untuk periode <strong>{period}</strong>.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/finance/budget/manage")}>
              Buat Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {data && hasBudgets && (
        <>
          {/* Category Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="category-summary">
            {(data.category_rollup || []).map((cat) => (
              <Card key={cat.category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{cat.category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xl font-bold">{formatCurrency(cat.actual)}</div>
                  <div className="text-sm text-muted-foreground">Budget: {formatCurrency(cat.budget)}</div>
                  {cat.variance_pct !== null && (
                    <div className={`flex items-center gap-1 text-sm ${getVarianceColor(cat.variance_pct, cat.category)}`}>
                      {cat.variance_pct > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span>{cat.variance_pct > 0 ? "+" : ""}{(cat.variance_pct || 0).toFixed(1)}%</span>
                    </div>
                  )}
                  {cat.budget > 0 && (
                    <Progress value={Math.min((cat.actual / cat.budget) * 100, 100)} className="h-1.5" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* COA Detail */}
          <Card data-testid="coa-detail-card">
            <CardHeader>
              <CardTitle>Detail per COA</CardTitle>
              <CardDescription>Perbandingan detail per akun</CardDescription>
            </CardHeader>
            <CardContent>
              {(data.coa_level || []).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada data</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>COA</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Var %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.coa_level || []).map((row) => (
                      <TableRow key={row.coa_id} data-testid={`coa-row-${row.coa_code}`}>
                        <TableCell>
                          <div className="font-medium">{row.coa_code}</div>
                          <div className="text-xs text-muted-foreground">{row.coa_name}</div>
                          <Badge variant="outline" className="text-xs mt-0.5">{row.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(row.budget)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{formatCurrency(row.actual)}</TableCell>
                        <TableCell className={`text-right text-sm ${getVarianceColor(row.variance_pct, row.category)}`}>
                          {formatCurrency(row.variance)}
                        </TableCell>
                        <TableCell className={`text-right text-sm ${getVarianceColor(row.variance_pct, row.category)}`}>
                          {row.variance_pct !== null ? `${row.variance_pct > 0 ? "+" : ""}${(row.variance_pct || 0).toFixed(1)}%` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-8 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Budget</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.total_budget)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Actual</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.total_actual)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Variance</div>
                  <div className={`text-2xl font-bold ${data.total_variance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {data.total_variance > 0 ? "+" : ""}{formatCurrency(data.total_variance)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
