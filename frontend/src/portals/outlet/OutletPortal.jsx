/** Outlet Portal shell — Navigation Restructuring: PortalSubNav removed, AppShell Sidebar+Subnav handles navigation. Sprint CRM-B: Voucher Redemption Station. */
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import OutletHome from "./OutletHome";
import DailySalesList from "./DailySalesList";
import DailySalesForm from "./DailySalesForm";
import DailySalesDetail from "./DailySalesDetail";
import PettyCashList from "./PettyCashList";
import UrgentPurchaseList from "./UrgentPurchaseList";
import KdoPage from "./KdoPage";
import BdoPage from "./BdoPage";
import FdoPage from "./FdoPage";
import DailyClose from "./DailyClose";
import StockCheck from "./inventory/StockCheck";
import StockTransfers from "./inventory/StockTransfers";
import UsageLog from "./inventory/UsageLog";
import VoucherRedemption from "./VoucherRedemption";
import LoyaltyPointsEntry from "./LoyaltyPointsEntry";

export default function OutletPortal() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Routes>
      <Route index element={<OutletHome />} />
      <Route path="daily-sales" element={<DailySalesList />} />
      <Route path="daily-sales/new" element={<DailySalesForm />} />
      <Route path="daily-sales/:id" element={<DailySalesDetail />} />
      <Route path="daily-sales/:id/edit" element={<DailySalesForm />} />
      <Route path="petty-cash" element={<PettyCashList />} />
      <Route path="kdo" element={<KdoPage />} />
      <Route path="bdo" element={<BdoPage />} />
      <Route path="fdo" element={<FdoPage />} />
      <Route path="urgent-purchase" element={<UrgentPurchaseList />} />
      <Route path="daily-close" element={<DailyClose />} />
      <Route path="opname" element={<Navigate to="/inventory/opname" replace />} />
      <Route path="inventory/stock-check" element={<StockCheck />} />
      <Route path="inventory/transfers" element={<StockTransfers />} />
      <Route path="inventory/usage" element={<UsageLog />} />
      <Route path="voucher-redeem" element={<VoucherRedemption />} />
      <Route path="loyalty/input-poin" element={<LoyaltyPointsEntry />} />
    </Routes>
  );
}
