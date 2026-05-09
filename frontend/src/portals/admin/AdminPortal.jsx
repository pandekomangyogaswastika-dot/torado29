import { Routes, Route, Navigate } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import { Settings as SettingsIcon, Users as UsersIcon, Shield, Database,
          ScrollText, Hash, GitBranch, Settings2, Activity, Plug, Calculator, Sparkles, Bell, Globe, Clock, BarChart2, LayoutTemplate } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import AdminHome from "./AdminHome";
import Users from "./Users";
import Roles from "./Roles";
import MasterData from "./MasterData";
import AuditLog from "./AuditLog";
import NumberSeries from "./NumberSeries";
import ApprovalWorkflows from "./ApprovalWorkflows";
import Operations from "./Operations";
import Integrations from "./Integrations";
import TaxConfig from "./TaxConfig";
import ConfigurationLayout from "./configuration/ConfigurationLayout";
import SalesSchemasPage from "./configuration/SalesSchemasPage";
import PettyCashPoliciesPage from "./configuration/PettyCashPoliciesPage";
import ServiceChargePoliciesPage from "./configuration/ServiceChargePoliciesPage";
import IncentiveSchemesPage from "./configuration/IncentiveSchemesPage";
import AnomalyThresholdsPage from "./configuration/AnomalyThresholdsPage";
import EffectiveDatingTimelinePage from "./configuration/EffectiveDatingTimelinePage";
import LoyaltyAdminHome from "./loyalty/LoyaltyAdminHome";
import LoyaltyAdminCustomers from "./loyalty/LoyaltyAdminCustomers";
import LoyaltyAdminCustomerDetail from "./loyalty/LoyaltyAdminCustomerDetail";
import LoyaltyAdminRewards from "./loyalty/LoyaltyAdminRewards";
import LoyaltyAdminRedemptions from "./loyalty/LoyaltyAdminRedemptions";
import CRMAnalytics from "./loyalty/CRMAnalytics";
import CMSBrands from "./cms/CMSBrands";
import CMSCareers from "./cms/CMSCareers";
import CMSOutlets from "./cms/CMSOutlets";
import CMSNews from "./cms/CMSNews";
import CMSMenu from "./cms/CMSMenu";
import MediaLibrary from "./cms/MediaLibrary";
import CMSPendingReviews from "./cms/CMSPendingReviews";
import CMSAnalytics from "./cms/CMSAnalytics";
import PageBuilder from "./cms/PageBuilder";
import ReportSchedules from "./ReportSchedules"; // Sprint E

const SUB_ROUTES = [
  { path: "",                 label: "Overview",       icon: SettingsIcon, exact: true },
  { path: "users",            label: "Users",          icon: UsersIcon },
  { path: "roles",            label: "Roles",          icon: Shield },
  { path: "master",           label: "Master Data",    icon: Database, prefix: true },
  { path: "configuration",    label: "Konfigurasi",    icon: Settings2, prefix: true },
  { path: "loyalty",          label: "Loyalty",        icon: Sparkles, prefix: true, perm: "admin.loyalty.read", badge: "NEW" },
  { path: "workflows",        label: "Workflows",      icon: GitBranch },
  { path: "number-series",    label: "Number Series",  icon: Hash },
  { path: "audit-log",        label: "Audit Log",      icon: ScrollText },
  { path: "integrations",     label: "Integrations",   icon: Plug, prefix: true, perm: "system.settings.read" },
  { path: "tax",             label: "Tax / Pajak",    icon: Calculator, perm: "system.settings.read", badge: "NEW" },
  { path: "operations",       label: "Operations",     icon: Activity, prefix: true, perm: "system.metrics.read" },
  { path: "report-schedules", label: "Laporan Terjadwal", icon: Bell, perm: "report_schedules.manage", badge: "NEW" },
  { path: "cms",             label: "CMS Compro",      icon: Globe, prefix: true, badge: "NEW" },
  { path: "cms/reviews",     label: "Pending Reviews", icon: Clock, prefix: false },
  { path: "cms/analytics",   label: "Analytics",       icon: BarChart2, prefix: false },
  { path: "cms/pages",       label: "Page Builder",    icon: LayoutTemplate, prefix: false },
];

export default function AdminPortal() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        icon={SettingsIcon}
        title="Admin Platform"
        subtitle="Master data, users, roles, dan konfigurasi sistem"
      />
      <div className="mb-5">
        <SubNav />
      </div>
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="users" element={<Users />} />
        <Route path="roles" element={<Roles />} />
        <Route path="master" element={<Navigate to="/admin/master/items" replace />} />
        <Route path="master/:entity" element={<MasterData />} />
        <Route path="configuration" element={<ConfigurationLayout />}>
          <Route index element={<Navigate to="/admin/configuration/sales-schemas" replace />} />
          <Route path="sales-schemas" element={<SalesSchemasPage />} />
          <Route path="petty-cash-policies" element={<PettyCashPoliciesPage />} />
          <Route path="service-charge-policies" element={<ServiceChargePoliciesPage />} />
          <Route path="incentive-schemes" element={<IncentiveSchemesPage />} />
          <Route path="anomaly-thresholds" element={<AnomalyThresholdsPage />} />
          <Route path="effective-dating" element={<EffectiveDatingTimelinePage />} />
        </Route>
        <Route path="workflows" element={<ApprovalWorkflows />} />
        <Route path="number-series" element={<NumberSeries />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="integrations/:tab" element={<Integrations />} />
        <Route path="tax" element={<TaxConfig />} />
        <Route path="operations/*" element={<Operations />} />

        {/* Loyalty admin nested routes */}
        <Route path="loyalty" element={<LoyaltyAdminHome />} />
        <Route path="loyalty/customers" element={<LoyaltyAdminCustomers />} />
        <Route path="loyalty/customers/:customerId" element={<LoyaltyAdminCustomerDetail />} />
        <Route path="loyalty/rewards" element={<LoyaltyAdminRewards />} />
        <Route path="loyalty/redemptions" element={<LoyaltyAdminRedemptions />} />
        <Route path="loyalty/analytics" element={<CRMAnalytics />} />
        
        {/* Sprint D: CMS routes */}
        <Route path="cms/brands" element={<CMSBrands />} />
        <Route path="cms/outlets" element={<CMSOutlets />} />
        <Route path="cms/news" element={<CMSNews />} />
        <Route path="cms/menu" element={<CMSMenu />} />
        <Route path="cms/careers" element={<CMSCareers />} />
        <Route path="cms/media" element={<MediaLibrary />} />
        {/* Sprint I-L: Reviews + Analytics + Page Builder */}
        <Route path="cms/reviews" element={<CMSPendingReviews />} />
        <Route path="cms/analytics" element={<CMSAnalytics />} />
        <Route path="cms/pages" element={<PageBuilder />} />
        {/* Sprint E: Scheduled Reports */}
        <Route path="report-schedules" element={<ReportSchedules />} />
      </Routes>
    </div>
  );
}

function SubNav() {
  const location = useLocation();
  const { user } = useAuth();
  const perms = new Set(user?.permissions || []);
  const isSuper = perms.has("*");
  const visible = SUB_ROUTES.filter((r) => !r.perm || isSuper || perms.has(r.perm));
  const base = "/admin";
  const current = location.pathname.replace(base, "").replace(/^\//, "");
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
      {visible.map((r) => {
        const isActive = r.exact
          ? current === r.path
          : (r.prefix
             ? current.startsWith(r.path)
             : current === r.path || current.startsWith(`${r.path}/`));
        const Icon = r.icon;
        return (
          <Link
            key={r.path || "home"}
            to={`${base}/${r.path}`}
            className={cn(
              "relative px-3.5 py-2 rounded-full text-sm flex items-center gap-2 whitespace-nowrap transition-colors",
              isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
            data-testid={`admin-tab-${r.path || "home"}`}
          >
            {isActive && (
              <motion.div
                layoutId="admin-subnav-pill"
                className="absolute inset-0 grad-aurora-soft rounded-full"
                transition={{ type: "spring", duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="h-3.5 w-3.5" />
              {r.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
