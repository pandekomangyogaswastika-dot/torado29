/** Reports Portal — Container for all report pages */
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import ReportsCatalog from "@/portals/reports/ReportsCatalog";
import DailySalesReport from "@/portals/reports/DailySalesReport";
import OutletPerformanceReport from "@/portals/reports/OutletPerformanceReport";
import FdoHistoryReport from "@/portals/reports/FdoHistoryReport";

export default function ReportsPortal() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Routes>
      <Route index element={<ReportsCatalog />} />
      <Route path="daily-sales" element={<DailySalesReport />} />
      <Route path="outlet-performance" element={<OutletPerformanceReport />} />
      <Route path="fdo-history" element={<FdoHistoryReport />} />
      {/* Coming soon routes will redirect to catalog or show placeholder */}
    </Routes>
  );
}
