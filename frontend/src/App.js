import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import { lazy, Suspense } from "react";

// Auth
import { AuthProvider } from "@/lib/auth";
import { useAuth } from "@/lib/auth";
import { LoyaltyAuthProvider } from "@/contexts/LoyaltyAuthContext";

// Error Boundary (Phase 5)
import ErrorBoundary from "@/components/shared/ErrorBoundary";

// PWA Install Banner (Sprint F)
import PWAInstallBanner from "@/components/shared/PWAInstallBanner";

// ERP Pages (eagerly loaded — small, critical path)
import AppShell from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import HomeRedirect from "@/pages/HomeRedirect";
import PortalSelection from "@/pages/PortalSelection";
import NoAccess from "@/pages/NoAccess";
import NotFound from "@/pages/NotFound";
import MyApprovals from "@/pages/MyApprovals";

// Loyalty Pages (eagerly loaded — lightweight)
import LoyaltyRegister from "@/pages/loyalty/LoyaltyRegister";
import LoyaltyLogin from "@/pages/loyalty/LoyaltyLogin";
import LoyaltyDashboard from "@/pages/loyalty/LoyaltyDashboard";
import LoyaltyCard from "@/pages/loyalty/LoyaltyCard";
import LoyaltyRewards from "@/pages/loyalty/LoyaltyRewards";
import LoyaltyHistory from "@/pages/loyalty/LoyaltyHistory";
import LoyaltyProfile from "@/pages/loyalty/LoyaltyProfile";
import RequireLoyaltyAuth from "@/components/loyalty/RequireLoyaltyAuth";

// Portals — lazy loaded for code splitting (Phase 4 performance)
const ExecutivePortal = lazy(() => import("@/portals/ExecutivePortal"));
const FinancePortal = lazy(() => import("@/portals/FinancePortal"));
const HRPortal = lazy(() => import("@/portals/HRPortal"));
const InventoryPortal = lazy(() => import("@/portals/InventoryPortal"));
const OutletPortal = lazy(() => import("@/portals/OutletPortal"));
const OwnerPortal = lazy(() => import("@/portals/OwnerPortal"));
const ProcurementPortal = lazy(() => import("@/portals/ProcurementPortal"));
const AdminPortal = lazy(() => import("@/portals/admin/AdminPortal"));

// Public Compro Pages — lazy loaded (heavy, not critical path)
const PublicLayout = lazy(() => import("@/pages/public/PublicLayout"));
const PublicHome = lazy(() => import("@/pages/public/PublicHome"));
const Brands = lazy(() => import("@/pages/public/Brands"));
const BrandDetail = lazy(() => import("@/pages/public/BrandDetail"));
const Menu = lazy(() => import("@/pages/public/Menu"));
const Locations = lazy(() => import("@/pages/public/Locations"));
const About = lazy(() => import("@/pages/public/About"));
const NewsPage = lazy(() => import("@/pages/public/News"));
const NewsDetailPage = lazy(() => import("@/pages/public/NewsDetail"));
const Careers = lazy(() => import("@/pages/public/Careers"));
const Contact = lazy(() => import("@/pages/public/Contact"));
const PublicPage = lazy(() => import("@/pages/public/PublicPage"));

// Optimized QueryClient (Phase 4)
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30s — data considered fresh
      gcTime: 5 * 60_000,     // 5 min — garbage collect
      retry: 1,
      refetchOnWindowFocus: false, // reduce unnecessary re-fetches
    },
  },
});

// Loading fallback for Suspense (minimal, no layout shift)
function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

// ERP auth guard
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="aurora-theme">
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <AuthProvider>
            {/* Global top-level error boundary — catches anything that slips through */}
            <ErrorBoundary scope="Aplikasi Torado ERP">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* ================================================
                      PUBLIC COMPRO ROUTES — No auth required
                  ================================================ */}
                  <Route
                    element={
                      <ErrorBoundary scope="Halaman Publik">
                        <PublicLayout />
                      </ErrorBoundary>
                    }
                  >
                    <Route index element={<PublicHome />} />
                    <Route path="brands" element={<Brands />} />
                    <Route path="brands/:brandId" element={<BrandDetail />} />
                    <Route path="menu" element={<Menu />} />
                    <Route path="locations" element={<Locations />} />
                    <Route path="about" element={<About />} />
                    <Route path="news" element={<NewsPage />} />
                    <Route path="news/:id" element={<NewsDetailPage />} />
                    <Route path="careers" element={<Careers />} />
                    <Route path="contact" element={<Contact />} />
                  </Route>

                  {/* ================================================
                      CUSTOM PAGES (Page Builder) — Sprint L
                  ================================================ */}
                  <Route path="pages/:slug" element={<PublicPage />} />

                  {/* ================================================
                      ERP AUTH ROUTE
                  ================================================ */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/no-access" element={<NoAccess />} />

                  {/* ================================================
                      LOYALTY / CRM ROUTES
                  ================================================ */}
                  <Route
                    path="/loyalty/register"
                    element={
                      <ErrorBoundary scope="Loyalty Register">
                        <LoyaltyAuthProvider><LoyaltyRegister /></LoyaltyAuthProvider>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/loyalty/login"
                    element={
                      <ErrorBoundary scope="Loyalty Login">
                        <LoyaltyAuthProvider><LoyaltyLogin /></LoyaltyAuthProvider>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/loyalty"
                    element={
                      <ErrorBoundary scope="Loyalty Dashboard">
                        <LoyaltyAuthProvider><RequireLoyaltyAuth><LoyaltyDashboard /></RequireLoyaltyAuth></LoyaltyAuthProvider>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/loyalty/card"
                    element={
                      <LoyaltyAuthProvider><RequireLoyaltyAuth><LoyaltyCard /></RequireLoyaltyAuth></LoyaltyAuthProvider>
                    }
                  />
                  <Route
                    path="/loyalty/rewards"
                    element={
                      <LoyaltyAuthProvider><RequireLoyaltyAuth><LoyaltyRewards /></RequireLoyaltyAuth></LoyaltyAuthProvider>
                    }
                  />
                  <Route
                    path="/loyalty/history"
                    element={
                      <LoyaltyAuthProvider><RequireLoyaltyAuth><LoyaltyHistory /></RequireLoyaltyAuth></LoyaltyAuthProvider>
                    }
                  />
                  <Route
                    path="/loyalty/profile"
                    element={
                      <LoyaltyAuthProvider><RequireLoyaltyAuth><LoyaltyProfile /></RequireLoyaltyAuth></LoyaltyAuthProvider>
                    }
                  />

                  {/* ================================================
                      ERP PROTECTED ROUTES — each portal wrapped in its own ErrorBoundary
                  ================================================ */}
                  <Route
                    element={
                      <RequireAuth>
                        <AppShell />
                      </RequireAuth>
                    }
                  >
                    <Route path="/erp" element={<HomeRedirect />} />
                    <Route path="/portal-select" element={<PortalSelection />} />
                    <Route path="/approvals" element={<MyApprovals />} />
                    {/* Convenience redirects for common bookmarks */}
                    <Route path="/master" element={<Navigate to="/admin/master/items" replace />} />
                    <Route path="/master/*" element={<Navigate to="/admin/master/items" replace />} />
                    <Route
                      path="/executive/*"
                      element={
                        <ErrorBoundary scope="Executive Portal">
                          <ExecutivePortal />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/finance/*"
                      element={
                        <ErrorBoundary scope="Finance Portal">
                          <FinancePortal />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/hr/*"
                      element={
                        <ErrorBoundary scope="HR Portal">
                          <HRPortal />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/inventory/*"
                      element={
                        <ErrorBoundary scope="Inventory Portal">
                          <InventoryPortal />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/outlet/*"
                      element={
                        <ErrorBoundary scope="Outlet Portal">
                          <OutletPortal />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/owner/*"
                      element={
                        <ErrorBoundary scope="Owner Portal">
                          <OwnerPortal />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/procurement/*"
                      element={
                        <ErrorBoundary scope="Procurement Portal">
                          <ProcurementPortal />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/admin/*"
                      element={
                        <ErrorBoundary scope="Admin Portal">
                          <AdminPortal />
                        </ErrorBoundary>
                      }
                    />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
        <Toaster position="top-right" />
        <PWAInstallBanner />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
