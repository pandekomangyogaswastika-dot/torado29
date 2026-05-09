/** HR Portal shell — Navigation Restructuring: PortalSubNav removed, AppShell Sidebar+Subnav handles navigation. */
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import HRHome from "./hr/HRHome";
import AdvancesList from "./hr/AdvancesList";
import ServiceChargeList from "./hr/ServiceChargeList";
import IncentiveList from "./hr/IncentiveList";
import VoucherList from "./hr/VoucherList";
import FOCList from "./hr/FOCList";
import LBFundLedger from "./hr/LBFundLedger";
import PayrollList from "./hr/PayrollList";

export default function HRPortal() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div data-testid="hr-portal">
      <Routes>
        <Route index element={<HRHome />} />
        <Route path="advances" element={<AdvancesList />} />
        <Route path="service-charge" element={<ServiceChargeList />} />
        <Route path="incentive" element={<IncentiveList />} />
        <Route path="voucher" element={<VoucherList />} />
        <Route path="foc" element={<FOCList />} />
        <Route path="lb-fund" element={<LBFundLedger />} />
        <Route path="payroll" element={<PayrollList />} />
      </Routes>
    </div>
  );
}
