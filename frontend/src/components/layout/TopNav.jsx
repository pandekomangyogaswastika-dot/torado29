import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Search, Menu } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useNavigation } from "@/contexts/NavigationContext";
import { visiblePortalsFor } from "@/lib/portals";
import { cn } from "@/lib/utils";
import UserMenu from "@/components/shared/UserMenu";
import NotificationBell from "@/components/shared/NotificationBell";
import ApprovalsInboxButton from "@/components/shared/ApprovalsInboxButton";
import ThemeToggle from "@/components/shared/ThemeToggle";

export default function TopNav({ onSearchOpen }) {
  const { user } = useAuth();
  const { openMobileDrawer } = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const portals = visiblePortalsFor(user);

  const activePortal = portals.find((p) => location.pathname.startsWith(p.path))?.id;

  return (
    <header
      className="glass-panel sticky top-0 z-40 px-3 sm:px-4 lg:px-6 h-[64px] lg:h-[72px] flex items-center justify-between gap-2"
      style={{ borderBottom: "1px solid rgb(var(--glass-border))" }}
    >
      {/* Logo + mobile menu */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={openMobileDrawer}
          className="lg:hidden h-10 w-10 rounded-full glass-input flex items-center justify-center hover:bg-foreground/5 transition-colors"
          aria-label="Buka menu navigasi"
          data-testid="topnav-menu-toggle"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg pr-1"
          aria-label="Torado ERP Home"
        >
          <div className="h-9 w-9 rounded-xl grad-aurora flex items-center justify-center shadow-md flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-bold text-sm tracking-tight">Torado</span>
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">ERP</span>
          </div>
        </button>
      </div>

      {/* Portal switcher (center on desktop) */}
      <nav
        className="hidden lg:flex items-center gap-1.5"
        aria-label="Portal"
      >
        {portals.map((p) => {
          const isActive = activePortal === p.id;
          const Icon = p.icon;
          return (
            <Link
              key={p.id}
              to={p.path}
              className={cn(
                "relative px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="active-portal-pill"
                  className="absolute inset-0 pill-active rounded-full"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {p.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Current portal label (mobile) */}
      <div className="lg:hidden flex-1 min-w-0 text-center">
        {activePortal && (
          <span className="text-sm font-semibold truncate block">
            {portals.find((p) => p.id === activePortal)?.name}
          </span>
        )}
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onSearchOpen}
          className="hidden sm:flex h-10 px-3 rounded-full glass-input items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-w-[180px]"
          data-testid="open-global-search"
          aria-label="Cari (⌘K)"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Cari…</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10" aria-hidden="true">⌘K</kbd>
        </button>
        <button
          onClick={onSearchOpen}
          className="sm:hidden h-10 w-10 rounded-full glass-input flex items-center justify-center hover:bg-foreground/5"
          aria-label="Cari"
          data-testid="open-global-search-mobile"
        >
          <Search className="h-5 w-5" />
        </button>
        <NotificationBell />
        <ApprovalsInboxButton />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
