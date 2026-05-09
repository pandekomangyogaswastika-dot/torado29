/** Inventory Portal shell — Navigation Restructuring: PortalSubNav removed, AppShell Sidebar+Subnav handles navigation. */
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import InventoryHome from "./InventoryHome";
import StockBalance from "./StockBalance";
import Movements from "./Movements";
import TransferList from "./TransferList";
import TransferDetail from "./TransferDetail";
import AdjustmentList from "./AdjustmentList";
import OpnameList from "./OpnameList";
import OpnameSession from "./OpnameSession";
import Valuation from "./Valuation";
import LowStockAlert from "./LowStockAlert";
import MarketListPage from "./MarketListPage";

export default function InventoryPortal() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Routes>
      <Route index element={<InventoryHome />} />
      <Route path="balance" element={<StockBalance />} />
      <Route path="low-stock" element={<LowStockAlert />} />
      <Route path="movements" element={<Movements />} />
      <Route path="transfers" element={<TransferList />} />
      <Route path="transfers/:id" element={<TransferDetail />} />
      <Route path="adjustments" element={<AdjustmentList />} />
      <Route path="opname" element={<OpnameList />} />
      <Route path="opname/:id" element={<OpnameSession />} />
      <Route path="valuation" element={<Valuation />} />
      <Route path="market-list" element={<MarketListPage />} />
    </Routes>
  );
}
