import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "@/lib/auth";
import { NavigationProvider } from "@/contexts/NavigationContext";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import Subnav from "./Subnav";
import MobileSidebar from "./MobileSidebar";
import GlobalSearch from "@/components/shared/GlobalSearch";
import NotificationDrawer from "@/components/shared/NotificationDrawer";
import { Toaster } from "@/components/ui/sonner";

export default function AppShell() {
  const { user, loading } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current page is portal selection
  const isPortalSelection = location.pathname === "/portal-select";

  // ⌘K / Ctrl+K opens global search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Redirect if not logged in (after loading completes)
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Memuat aplikasi">
        <div className="glass-card px-6 py-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-aurora animate-pulse" />
          <span className="text-sm text-muted-foreground">Memuat…</span>
        </div>
      </div>
    );
  }

  return (
    <NavigationProvider>
      <div className="relative z-[1] min-h-screen flex flex-col">
        {/* Skip to content — a11y */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-lg focus:pill-active focus:text-sm focus:shadow-lg"
        >
          Lewati ke konten utama
        </a>

        {/* Level 1: Top Navigation - hide on portal selection */}
        {!isPortalSelection && (
          <TopNav
            onSearchOpen={() => setSearchOpen(true)}
            onNotifOpen={() => setNotifOpen(true)}
          />
        )}

        {/* Mobile Sidebar (Sheet) - hide on portal selection */}
        {!isPortalSelection && <MobileSidebar />}

        {/* Level 2 & 3: Sidebar + Subnav + Content */}
        <div className="flex-1 flex w-full">
          {/* Level 2: Left Sidebar (Desktop only) - hide on portal selection */}
          {!isPortalSelection && <Sidebar />}
          
          {/* Content area with Subnav */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Level 3: Horizontal Subnav (sticky) - hide on portal selection */}
            {!isPortalSelection && <Subnav />}
            
            {/* Main content */}
            <main
              id="main-content"
              tabIndex={-1}
              className={`flex-1 px-4 sm:px-5 lg:px-8 py-5 lg:py-8 pb-20 lg:pb-8 max-w-[1600px] mx-auto w-full ${isPortalSelection ? "pt-0 px-0 max-w-full" : ""}`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
        
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
        <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
        <Toaster position="top-right" />
      </div>
    </NavigationProvider>
  );
}
