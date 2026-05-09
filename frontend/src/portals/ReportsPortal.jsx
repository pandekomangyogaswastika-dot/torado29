/** Reports Portal — Container for all report pages */
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import ReportsCatalog from "@/portals/reports/ReportsCatalog";
import DailySalesReport from "@/portals/reports/DailySalesReport";
import OutletPerformanceReport from "@/portals/reports/OutletPerformanceReport";
import FdoHistoryReport from "@/portals/reports/FdoHistoryReport";
import StockBalanceReport from "@/portals/reports/StockBalanceReport";
import StockMovementReport from "@/portals/reports/StockMovementReport";
import InventoryValuationReport from "@/portals/reports/InventoryValuationReport";
import POSummaryReport from "@/portals/reports/POSummaryReport";
import GRSummaryReport from "@/portals/reports/GRSummaryReport";
import VendorPerformanceReport from "@/portals/reports/VendorPerformanceReport";

export default function ReportsPortal() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Routes>
      <Route index element={<ReportsCatalog />} />
      <Route path="daily-sales" element={<DailySalesReport />} />
      <Route path="outlet-performance" element={<OutletPerformanceReport />} />
      <Route path="fdo-history" element={<FdoHistoryReport />} />
      <Route path="stock-balance" element={<StockBalanceReport />} />
      <Route path="stock-movement" element={<StockMovementReport />} />
      <Route path="inventory-valuation" element={<InventoryValuationReport />} />
      <Route path="po-summary" element={<POSummaryReport />} />
      <Route path="gr-summary" element={<GRSummaryReport />} />
      <Route path="vendor-performance" element={<VendorPerformanceReport />} />
      {/* Coming soon routes will redirect to catalog or show placeholder */}
    </Routes>
  );
}
