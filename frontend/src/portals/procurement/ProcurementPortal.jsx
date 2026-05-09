/** Procurement Portal shell — Navigation Restructuring: PortalSubNav removed, AppShell Sidebar+Subnav handles navigation. */
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import ProcurementHome from "./ProcurementHome";
import KanbanWorkboard from "./KanbanWorkboard";
import VendorComparison from "./VendorComparison";
import PRList from "./PRList";
import PRForm from "./PRForm";
import PRDetail from "./PRDetail";
import POList from "./POList";
import POForm from "./POForm";
import PODetail from "./PODetail";
import GRList from "./GRList";
import GRForm from "./GRForm";
import VendorRecommendPage from "./VendorRecommendPage";
import RFQList from "./RFQList";
import RFQDetail, { RFQForm } from "./RFQDetail";
import PriceIntelligence from "./PriceIntelligence";
import VendorCatalog from "./VendorCatalog";

export default function ProcurementPortal() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Routes>
      <Route index element={<ProcurementHome />} />
      <Route path="kanban" element={<KanbanWorkboard />} />
      <Route path="vendor-comparison" element={<VendorComparison />} />
      <Route path="vendor-recommend" element={<VendorRecommendPage />} />
      <Route path="price-intelligence" element={<PriceIntelligence />} />
      <Route path="vendor-catalog" element={<VendorCatalog />} />
      <Route path="rfq" element={<RFQList />} />
      <Route path="rfq/new" element={<RFQForm />} />
      <Route path="rfq/:id" element={<RFQDetail />} />
      <Route path="pr" element={<PRList />} />
      <Route path="pr/new" element={<PRForm />} />
      <Route path="pr/:id" element={<PRDetail />} />
      <Route path="po" element={<POList />} />
      <Route path="po/new" element={<POForm />} />
      <Route path="po/:id" element={<PODetail />} />
      <Route path="gr" element={<GRList />} />
      <Route path="gr/new" element={<GRForm />} />
    </Routes>
  );
}
