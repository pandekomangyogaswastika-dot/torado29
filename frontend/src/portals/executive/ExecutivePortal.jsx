/**
 * ExecutivePortal — Phase 9A multi-route shell.
 *
 * Routes:
 *   /executive             → ExecutiveHome (dashboard)
 *   /executive/brand/:id   → BrandDrilldown
 *   /executive/outlet/:id  → OutletDrilldown
 */
import { Routes, Route, Navigate } from "react-router-dom";
import ExecutiveHome from "./ExecutiveHome";
import BrandDrilldown from "./BrandDrilldown";
import OutletDrilldown from "./OutletDrilldown";
import ProfitWalk from "./ProfitWalk";
import PeriodCompare from "./PeriodCompare";

export default function ExecutivePortal() {
  return (
    <Routes>
      <Route index element={<ExecutiveHome />} />
      <Route path="brand/:brandId" element={<BrandDrilldown />} />
      <Route path="outlet/:outletId" element={<OutletDrilldown />} />
      <Route path="profit-walk" element={<ProfitWalk />} />
      <Route path="period-compare" element={<PeriodCompare />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
