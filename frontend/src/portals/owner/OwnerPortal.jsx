/** Owner Portal shell — Navigation Restructuring: PortalSubNav removed, AppShell Sidebar+Subnav handles navigation. */
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import OwnerCockpit from "./OwnerCockpit";
import DailyBriefing from "./DailyBriefing";
import DigestSettings from "./DigestSettings";
import CashPosition from "@/portals/finance/CashPosition";
import MyApprovals from "@/pages/MyApprovals";
import ConversationalQA from "@/components/shared/ConversationalQA";

export default function OwnerPortal() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Routes>
      <Route index element={<OwnerCockpit />} />
      <Route path="cockpit" element={<OwnerCockpit />} />
      <Route path="briefing" element={<DailyBriefing />} />
      <Route path="cash" element={<CashPosition />} />
      <Route path="approvals" element={<MyApprovals />} />
      <Route path="ai-assistant" element={
        <div className="glass-card p-5">
          <ConversationalQA scopeLabel="Owner" />
        </div>
      } />
      <Route path="digest-settings" element={<DigestSettings />} />
    </Routes>
  );
}
