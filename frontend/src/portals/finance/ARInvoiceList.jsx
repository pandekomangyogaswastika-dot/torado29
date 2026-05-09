/** AR Invoice List — Sprint 2 */
import { useState, useEffect } from "react";
import { Users, Plus, FileText, Send, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatCurrency, formatDateID } from "@/lib/format";

export default function ARInvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("invoices");

  useEffect(() => {
    if (activeTab === "invoices") {
      loadInvoices();
    } else {
      loadCustomers();
    }
  }, [activeTab]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ar/invoices", { params: { per_page: 50 } });
      if (res.data.success) {
        setInvoices(res.data.data.items);
      }
    } catch (err) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ar/customers");
      if (res.data.success) {
        setCustomers(res.data.data.items);
      }
    } catch (err) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: "secondary",
      sent: "default",
      partial: "outline",
      paid: "default",
      overdue: "destructive",
      cancelled: "secondary",
    };
    const colors = {
      paid: "bg-green-500",
    };
    return (
      <Badge variant={variants[status] || "default"} className={colors[status]}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-testid="ar-invoice-list">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6" />
            AR Ledger
          </h2>
          <p className="text-muted-foreground">Kelola invoice piutang, customer, dan rekonsiliasi AR</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="add-customer-btn">
            <Plus className="h-4 w-4 mr-2" />
            Customer Baru
          </Button>
          <Button data-testid="create-invoice-btn">
            <Plus className="h-4 w-4 mr-2" />
            Invoice Baru
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="ar-tabs">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="aging">Aging Report</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <Card data-testid="invoices-table-card">
            <CardContent className="pt-6">
              {loading ? (
                <p className="text-center py-8">Loading...</p>
              ) : invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada invoice</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} data-testid={`invoice-row-${inv.invoice_no}`}>
                        <TableCell className="font-mono">{inv.invoice_no}</TableCell>
                        <TableCell>{inv.customer_name}</TableCell>
                        <TableCell>{formatDateID(inv.invoice_date)}</TableCell>
                        <TableCell>{formatDateID(inv.due_date)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(inv.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {inv.outstanding > 0 ? (
                            <span className="text-orange-600">{formatCurrency(inv.outstanding)}</span>
                          ) : (
                            <span className="text-green-600">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(inv.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" data-testid={`view-invoice-${inv.invoice_no}`}>
                              <FileText className="h-3 w-3" />
                            </Button>
                            {inv.status === "draft" && (
                              <Button size="sm" variant="ghost" data-testid={`send-invoice-${inv.invoice_no}`}>
                                <Send className="h-3 w-3" />
                              </Button>
                            )}
                            {inv.outstanding > 0 && (
                              <Button size="sm" variant="ghost" data-testid={`record-payment-${inv.invoice_no}`}>
                                <DollarSign className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <Card data-testid="customers-table-card">
            <CardContent className="pt-6">
              {loading ? (
                <p className="text-center py-8">Loading...</p>
              ) : customers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada customer</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>NPWP</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((cust) => (
                      <TableRow key={cust.id} data-testid={`customer-row-${cust.name}`}>
                        <TableCell className="font-medium">{cust.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{cust.channel}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{cust.npwp || "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">{cust.contact_person || "-"}</div>
                          <div className="text-xs text-muted-foreground">{cust.phone || "-"}</div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(cust.total_outstanding)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AR Aging Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Aging report akan ditampilkan di sini
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
