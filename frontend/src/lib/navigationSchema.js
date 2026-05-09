/**
 * Navigation schema untuk 8 portals — Sprint A update
 * Ditambahkan: Admin (Config, Audit, Loyalty), Finance (Assets, Budget, AR, COA, Reports),
 * HR (Incentive, FOC, Benefits), Procurement (Vendor Compare, Kanban),
 * Inventory (Low Stock, Movements, Valuation), Outlet (Urgent Purchase, Closing),
 * Executive (Analytics: Period Compare, Profit Walk), Owner (Digest Settings)
 */

import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Settings,
  FileText,
  ScrollText,
  CreditCard,
  Calculator,
  FileCheck,
  Calendar,
  Banknote,
  Receipt,
  TrendingUp,
  Wallet,
  UserCog,
  DollarSign,
  Gift,
  ClipboardList,
  ShoppingCart,
  Truck,
  Store,
  BarChart3,
  Boxes,
  ArrowLeftRight,
  ClipboardCheck,
  WrenchIcon,
  Crown,
  Sparkles,
  Brain,
  MessageSquare,
  Shield,
  Activity,
  Star,
  AlertTriangle,
  Layers,
  BookOpen,
  Archive,
  Target,
  Workflow,
  Coffee,
  ListChecks,
  History,
  BellRing,
  ChevronRight,
  Landmark,
  LineChart,
  PiggyBank,
  QrCode,
} from "lucide-react";

export const NAVIGATION_SCHEMA = {
  // ────────────────────────────────────────────────────────────────────────────
  // ADMIN PORTAL
  // ────────────────────────────────────────────────────────────────────────────
  admin: {
    id: "admin",
    name: "Admin Portal",
    sections: [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: LayoutDashboard,
        items: [
          { id: "overview", name: "Overview", path: "/admin" },
        ],
      },
      {
        id: "user-management",
        name: "User Management",
        icon: Users,
        items: [
          { id: "users", name: "All Users", path: "/admin/users" },
          { id: "roles", name: "Roles & Permissions", path: "/admin/roles" },
          { id: "audit-log", name: "Activity Log", path: "/admin/audit-log" },
        ],
      },
      {
        id: "organization",
        name: "Organization",
        icon: Building2,
        items: [
          { id: "outlets", name: "Outlets", path: "/admin/master/outlets" },
          { id: "brands", name: "Brands", path: "/admin/master/brands" },
        ],
      },
      {
        id: "master-data",
        name: "Master Data",
        icon: Package,
        items: [
          { id: "items", name: "Items", path: "/admin/master/items" },
          { id: "vendors", name: "Vendors", path: "/admin/master/vendors" },
          { id: "payment-methods", name: "Payment Methods", path: "/admin/master/payment-methods" },
          { id: "employees", name: "Employees", path: "/admin/master/employees" },
        ],
      },
      {
        id: "configuration",
        name: "Configuration",
        icon: Shield,
        items: [
          { id: "business-rules", name: "Business Rules", path: "/admin/configuration" },
          { id: "approval-workflows", name: "Approval Workflows", path: "/admin/workflows" },
          { id: "number-series", name: "Number Series", path: "/admin/number-series" },
          { id: "integrations", name: "Integrations", path: "/admin/integrations" },
          { id: "tax-config", name: "Tax Config", path: "/admin/tax" },
        ],
      },
      {
        id: "loyalty-admin",
        name: "Loyalty Program",
        icon: Star,
        items: [
          { id: "loyalty-overview", name: "Loyalty Overview", path: "/admin/loyalty" },
          { id: "loyalty-customers", name: "Customers", path: "/admin/loyalty/customers" },
          { id: "loyalty-rewards", name: "Rewards Catalog", path: "/admin/loyalty/rewards" },
          { id: "loyalty-redemptions", name: "Redemptions", path: "/admin/loyalty/redemptions" },
        ],
      },
      {
        id: "settings",
        name: "System Settings",
        icon: Settings,
        items: [
          { id: "general", name: "General", path: "/admin/settings" },
        ],
      },
      {
        id: "cms",
        name: "Content Management",
        icon: FileText,
        items: [
          { id: "brands", name: "Brands", path: "/admin/cms/brands" },
          { id: "outlets", name: "Outlets", path: "/admin/cms/outlets" },
          { id: "news", name: "News & Events", path: "/admin/cms/news" },
          { id: "menu", name: "Menu Items", path: "/admin/cms/menu" },
          { id: "careers", name: "Careers / Jobs", path: "/admin/cms/careers" },
          { id: "media", name: "Media Library", path: "/admin/cms/media" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // EXECUTIVE PORTAL
  // ────────────────────────────────────────────────────────────────────────────
  executive: {
    id: "executive",
    name: "Executive Portal",
    sections: [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: LayoutDashboard,
        items: [
          { id: "overview", name: "Overview", path: "/executive" },
        ],
      },
      {
        id: "performance",
        name: "Performance",
        icon: TrendingUp,
        items: [
          { id: "brand-mix", name: "Brand Mix", path: "/executive/brand/" },
          { id: "profit-walk", name: "Profit Walk", path: "/executive/profit-walk" },
        ],
      },
      {
        id: "analytics",
        name: "Analytics",
        icon: BarChart3,
        items: [
          { id: "period-compare", name: "Period Compare", path: "/executive/period-compare" },
        ],
      },
      {
        id: "ai-insights",
        name: "AI Insights",
        icon: Brain,
        items: [
          { id: "exec-qa", name: "Executive Q&A", path: "/executive/ai-qa" },
          { id: "anomaly", name: "Anomaly Detection", path: "/executive/anomaly" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // FINANCE PORTAL
  // ────────────────────────────────────────────────────────────────────────────
  finance: {
    id: "finance",
    name: "Finance Portal",
    sections: [
      {
        id: "overview",
        name: "Overview",
        icon: LayoutDashboard,
        items: [
          { id: "dashboard", name: "Dashboard", path: "/finance" },
        ],
      },
      {
        id: "transactions",
        name: "Transactions",
        icon: Receipt,
        items: [
          { id: "validation", name: "Sales Validation", path: "/finance/validation" },
          { id: "journals", name: "Journals", path: "/finance/journals" },
          { id: "manual-je", name: "Manual JE", path: "/finance/manual-journal" },
        ],
      },
      {
        id: "payments",
        name: "Payments",
        icon: CreditCard,
        items: [
          { id: "payment-requests", name: "Payment Requests", path: "/finance/payment-requests" },
          { id: "ap", name: "Accounts Payable", path: "/finance/ap-aging" },
          { id: "payments", name: "Payments", path: "/finance/payments" },
          { id: "bank-recon", name: "Bank Reconciliation", path: "/finance/bank-recon" },
          { id: "ar-invoices", name: "AR Invoices", path: "/finance/ar-invoices" },
        ],
      },
      {
        id: "reports",
        name: "Reports",
        icon: FileText,
        items: [
          { id: "trial-balance", name: "Trial Balance", path: "/finance/trial-balance" },
          { id: "profit-loss", name: "Profit & Loss", path: "/finance/profit-loss" },
          { id: "balance-sheet", name: "Balance Sheet", path: "/finance/balance-sheet" },
          { id: "cashflow", name: "Cashflow", path: "/finance/cashflow" },
          { id: "comparatives", name: "Period Compare", path: "/finance/comparatives" },
          { id: "report-builder", name: "Custom Reports", path: "/finance/report-builder" },
          { id: "pivot", name: "Pivot Analysis", path: "/finance/pivot" },
        ],
      },
      {
        id: "tax",
        name: "Tax & Compliance",
        icon: FileCheck,
        items: [
          { id: "tax", name: "Tax Center", path: "/finance/tax" },
          { id: "efaktur", name: "e-Faktur", path: "/finance/efaktur" },
        ],
      },
      {
        id: "assets-budget",
        name: "Assets & Budget",
        icon: Landmark,
        items: [
          { id: "assets", name: "Fixed Assets", path: "/finance/assets" },
          { id: "budget", name: "Budget vs Actual", path: "/finance/budget" },
          { id: "forecasting", name: "Forecasting", path: "/finance/forecasting" },
        ],
      },
      {
        id: "period",
        name: "Period Management",
        icon: Calendar,
        items: [
          { id: "periods", name: "Periods", path: "/finance/periods" },
          { id: "closing-wizard", name: "Closing Wizard", path: "/finance/closing-wizard" },
          { id: "anomalies", name: "Anomaly Feed", path: "/finance/anomalies" },
        ],
      },
      {
        id: "finance-config",
        name: "Finance Config",
        icon: BookOpen,
        items: [
          { id: "coa", name: "Chart of Accounts", path: "/finance/coa" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // HR PORTAL
  // ────────────────────────────────────────────────────────────────────────────
  hr: {
    id: "hr",
    name: "HR Portal",
    sections: [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: LayoutDashboard,
        items: [
          { id: "overview", name: "Overview", path: "/hr" },
        ],
      },
      {
        id: "payroll",
        name: "Payroll",
        icon: DollarSign,
        items: [
          { id: "payroll", name: "Payroll Processing", path: "/hr/payroll" },
          { id: "service-charge", name: "Service Charge", path: "/hr/service-charge" },
        ],
      },
      {
        id: "benefits",
        name: "Benefits & Incentives",
        icon: Gift,
        items: [
          { id: "incentive", name: "Incentive Programs", path: "/hr/incentive" },
          { id: "voucher", name: "Voucher Issuance", path: "/hr/voucher" },
          { id: "foc", name: "FOC Management", path: "/hr/foc" },
        ],
      },
      {
        id: "advances",
        name: "Advances & Funds",
        icon: Wallet,
        items: [
          { id: "advance", name: "Employee Advances", path: "/hr/advances" },
          { id: "lb-fund", name: "LB Fund Ledger", path: "/hr/lb-fund" },
        ],
      },
      {
        id: "hr-config",
        name: "HR Config",
        icon: WrenchIcon,
        items: [
          { id: "employees", name: "Employees", path: "/admin/master/employees" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // PROCUREMENT PORTAL
  // ────────────────────────────────────────────────────────────────────────────
  procurement: {
    id: "procurement",
    name: "Procurement Portal",
    sections: [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: LayoutDashboard,
        items: [
          { id: "overview", name: "Overview", path: "/procurement" },
        ],
      },
      {
        id: "requests",
        name: "Requests",
        icon: ClipboardList,
        items: [
          { id: "pr", name: "Purchase Requests", path: "/procurement/pr" },
          { id: "consolidation", name: "PR Consolidation", path: "/procurement/consolidation" },
        ],
      },
      {
        id: "purchase-orders",
        name: "Purchase Orders",
        icon: ShoppingCart,
        items: [
          { id: "po", name: "All POs", path: "/procurement/po" },
          { id: "comparison", name: "PO Comparison", path: "/procurement/po-comparison" },
        ],
      },
      {
        id: "goods-receipt",
        name: "Goods Receipt",
        icon: Truck,
        items: [
          { id: "gr", name: "All GRs", path: "/procurement/gr" },
        ],
      },
      {
        id: "vendors",
        name: "Vendors",
        icon: Store,
        items: [
          { id: "vendors", name: "All Vendors", path: "/procurement/vendors" },
          { id: "scorecard", name: "Vendor Scorecard", path: "/procurement/vendor-scorecard" },
          { id: "comparison", name: "Vendor Comparison", path: "/procurement/vendor-comparison" },
        ],
      },
      {
        id: "workflow",
        name: "Workflow",
        icon: Workflow,
        items: [
          { id: "kanban", name: "PO Kanban Board", path: "/procurement/kanban" },
          { id: "rfq", name: "RFQ History", path: "/procurement/rfq" },
        ],
      },
      {
        id: "smart-procurement",
        name: "Smart Procurement",
        icon: BarChart3,
        items: [
          { id: "price-intelligence", name: "Price Intelligence", path: "/procurement/price-intelligence" },
          { id: "vendor-catalog", name: "Vendor Item Catalog", path: "/procurement/vendor-catalog" },
          { id: "vendor-recommend", name: "AI Vendor Recommend", path: "/procurement/vendor-recommend" },
          { id: "vendor-comparison", name: "Vendor Comparison", path: "/procurement/vendor-comparison" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // INVENTORY PORTAL
  // ────────────────────────────────────────────────────────────────────────────
  inventory: {
    id: "inventory",
    name: "Inventory Portal",
    sections: [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: LayoutDashboard,
        items: [
          { id: "overview", name: "Overview", path: "/inventory" },
        ],
      },
      {
        id: "stock",
        name: "Stock Management",
        icon: Boxes,
        items: [
          { id: "balance", name: "Stock Balance", path: "/inventory/balance" },
          { id: "low-stock", name: "Low Stock Alert", path: "/inventory/low-stock" },
          { id: "valuation", name: "Stock Valuation", path: "/inventory/valuation" },
        ],
      },
      {
        id: "movements",
        name: "Movements",
        icon: ArrowLeftRight,
        items: [
          { id: "movements", name: "Movement History", path: "/inventory/movements" },
          { id: "transfer", name: "Transfers", path: "/inventory/transfers" },
          { id: "adjustment", name: "Adjustments", path: "/inventory/adjustments" },
        ],
      },
      {
        id: "opname",
        name: "Stock Opname",
        icon: ClipboardCheck,
        items: [
          { id: "opname", name: "Start Opname", path: "/inventory/opname" },
        ],
      },
      {
        id: "market-list",
        name: "Market List",
        icon: Star,
        items: [
          { id: "market-list", name: "Market List (Harga Acuan)", path: "/inventory/market-list" },
        ],
      },
      {
        id: "inventory-config",
        name: "Inventory Config",
        icon: WrenchIcon,
        items: [
          { id: "items", name: "Item Catalog", path: "/admin/master/items" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // OUTLET PORTAL
  // ────────────────────────────────────────────────────────────────────────────
  outlet: {
    id: "outlet",
    name: "Outlet Portal",
    sections: [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: LayoutDashboard,
        items: [
          { id: "overview", name: "Today's Summary", path: "/outlet" },
        ],
      },
      {
        id: "daily-ops",
        name: "Daily Operations",
        icon: Receipt,
        items: [
          { id: "daily-sales", name: "Daily Sales", path: "/outlet/daily-sales" },
          { id: "sales-wizard", name: "Sales Wizard", path: "/outlet/sales-wizard" },
          { id: "urgent-purchase", name: "Urgent Purchase", path: "/outlet/urgent-purchase" },
        ],
      },
      {
        id: "cash",
        name: "Cash Management",
        icon: Banknote,
        items: [
          { id: "petty-cash", name: "Petty Cash", path: "/outlet/petty-cash" },
        ],
      },
      {
        id: "kitchen",
        name: "Daily Orders",
        icon: ScrollText,
        items: [
          { id: "kdo", name: "KDO — Kitchen", path: "/outlet/kdo" },
          { id: "bdo", name: "BDO — Bar", path: "/outlet/bdo" },
          { id: "fdo", name: "FDO — Floor", path: "/outlet/fdo" },
        ],
      },
      {
        id: "closing",
        name: "Shift & Closing",
        icon: History,
        items: [
          { id: "daily-close", name: "Daily Close", path: "/outlet/daily-close" },
        ],
      },
      {
        id: "loyalty-redeem",
        name: "Loyalty",
        icon: QrCode,
        items: [
          { id: "loyalty-points", name: "Input Poin Kasir", path: "/outlet/loyalty/input-poin" },
          { id: "voucher-redeem", name: "Voucher Redeem", path: "/outlet/voucher-redeem" },
        ],
      },
      {
        id: "inventory",
        name: "Outlet Inventory",
        icon: Boxes,
        items: [
          { id: "stock-check", name: "Stock Check", path: "/outlet/inventory/stock-check" },
          { id: "transfers", name: "Stock Transfers", path: "/outlet/inventory/transfers" },
          { id: "usage", name: "Usage Log", path: "/outlet/inventory/usage" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // OWNER PORTAL
  // ────────────────────────────────────────────────────────────────────────────
  owner: {
    id: "owner",
    name: "Owner Portal",
    sections: [
      {
        id: "cockpit",
        name: "Cockpit",
        icon: Crown,
        items: [
          { id: "overview", name: "Executive Summary", path: "/owner" },
          { id: "daily-briefing", name: "Daily Briefing AI", path: "/owner/briefing" },
        ],
      },
      {
        id: "financial",
        name: "Financial Health",
        icon: TrendingUp,
        items: [
          { id: "cash-position", name: "Cash Position", path: "/owner/cash" },
        ],
      },
      {
        id: "ai",
        name: "AI Insights",
        icon: Sparkles,
        items: [
          { id: "business-qa", name: "Business Q&A", path: "/owner/ai-assistant" },
        ],
      },
      {
        id: "approvals",
        name: "Approvals",
        icon: ListChecks,
        items: [
          { id: "my-approvals", name: "My Approvals", path: "/owner/approvals" },
        ],
      },
      {
        id: "digest",
        name: "Digest & Alerts",
        icon: MessageSquare,
        items: [
          { id: "digest-settings", name: "Alert Settings", path: "/owner/digest-settings" },
        ],
      },
    ],
  },
};

/**
 * Get navigation schema for a specific portal
 */
export function getNavigationSchema(portalId) {
  return NAVIGATION_SCHEMA[portalId] || null;
}

/**
 * Get all sections for a portal
 */
export function getPortalSections(portalId) {
  const schema = getNavigationSchema(portalId);
  return schema?.sections || [];
}
