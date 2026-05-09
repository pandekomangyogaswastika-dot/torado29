import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, LogOut, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PORTALS, visiblePortalsFor } from "@/lib/portals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Portal card background images dari design guidelines
const PORTAL_BG_IMAGES = {
  admin: "https://images.unsplash.com/photo-1661422586023-681ea60507e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZGFyayUyMGludGVyaW9yJTIwbW9vZHl8ZW58MHx8fGJsYWNrfDE3Nzc5MTMwNzh8MA&ixlib=rb-4.1.0&q=85",
  executive: "https://images.unsplash.com/photo-1642477303430-ad6b97b6ad78?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZGFyayUyMGludGVyaW9yJTIwbW9vZHl8ZW58MHx8fGJsYWNrfDE3Nzc5MTMwNzh8MA&ixlib=rb-4.1.0&q=85",
  finance: "https://images.unsplash.com/photo-1469234496837-d0101f54be3e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZGFyayUyMGludGVyaW9yJTIwbW9vZHl8ZW58MHx8fGJsYWNrfDE3Nzc5MTMwNzh8MA&ixlib=rb-4.1.0&q=85",
  hr: "https://images.unsplash.com/photo-1661422586023-681ea60507e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZGFyayUyMGludGVyaW9yJTIwbW9vZHl8ZW58MHx8fGJsYWNrfDE3Nzc5MTMwNzh8MA&ixlib=rb-4.1.0&q=85",
  procurement: "https://images.unsplash.com/photo-1642477303430-ad6b97b6ad78?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZGFyayUyMGludGVyaW9yJTIwbW9vZHl8ZW58MHx8fGJsYWNrfDE3Nzc5MTMwNzh8MA&ixlib=rb-4.1.0&q=85",
  inventory: "https://images.unsplash.com/photo-1469234496837-d0101f54be3e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZGFyayUyMGludGVyaW9yJTIwbW9vZHl8ZW58MHx8fGJsYWNrfDE3Nzc5MTMwNzh8MA&ixlib=rb-4.1.0&q=85",
  outlet: "https://images.unsplash.com/photo-1661422586023-681ea60507e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZGFyayUyMGludGVyaW9yJTIwbW9vZHl8ZW58MHx8fGJsYWNrfDE3Nzc5MTMwNzh8MA&ixlib=rb-4.1.0&q=85",
  owner: "https://images.unsplash.com/photo-1642477303430-ad6b97b6ad78?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXN0YXVyYW50JTIwZGFyayUyMGludGVyaW9yJTIwbW9vZHl8ZW58MHx8fGJsYWNrfDE3Nzc5MTMwNzh8MA&ixlib=rb-4.1.0&q=85"
};

// Portal descriptions
const PORTAL_DESCRIPTIONS = {
  admin: "Kelola pengguna, role, master data, dan konfigurasi sistem",
  executive: "Dashboard eksekutif, analitik, dan insights bisnis",
  finance: "Jurnal, laporan keuangan, pajak, aset, dan budget",
  hr: "Payroll, service charge, advance, dan manajemen SDM",
  procurement: "Purchase request, purchase order, dan vendor management",
  inventory: "Stock balance, transfer, opname, dan adjustments",
  outlet: "Daily sales, petty cash, KDO/BDO operasional",
  owner: "Business cockpit, cash position, dan digest"
};

// Portal accent colors (HSL) dari design guidelines
const PORTAL_ACCENTS = {
  admin: "280 100% 70%",
  executive: "220 80% 60%",
  finance: "142 76% 36%",
  hr: "25 95% 53%",
  procurement: "199 89% 48%",
  inventory: "48 96% 53%",
  outlet: "339 90% 51%",
  owner: "271 76% 53%"
};

function PortalCard({ portal, index, onClick }) {
  const Icon = portal.icon;
  const bgImage = PORTAL_BG_IMAGES[portal.id];
  const description = PORTAL_DESCRIPTIONS[portal.id];
  const accentHsl = PORTAL_ACCENTS[portal.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{ y: -2 }}
      data-testid={`portal-card-${portal.id}`}
    >
      <Card
        className="relative overflow-hidden rounded-[18px] border border-border bg-card/70 backdrop-blur-md cursor-pointer group h-full min-h-[190px] transition-all duration-260"
        style={{
          transitionProperty: "transform, box-shadow",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onClick={onClick}
      >
        {/* Background image layer */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.55] transition-transform duration-260 group-hover:scale-103"
          style={{
            backgroundImage: `url(${bgImage})`,
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10 transition-opacity duration-260 group-hover:opacity-90" />

        {/* Accent glow (top-left corner) */}
        <div
          className="absolute -inset-10 blur-2xl opacity-60 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 20%, hsl(${accentHsl} / 0.35) 0%, transparent 55%)`
          }}
        />

        {/* Content */}
        <CardHeader className="relative p-5 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, hsl(${accentHsl} / 0.9) 0%, hsl(${accentHsl} / 0.6) 100%)`
                }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <CardTitle
                className="font-['Cormorant_Garamond'] text-xl md:text-2xl font-medium"
                style={{ color: "var(--ismaya-cream, #F8F5EF)" }}
              >
                {portal.name}
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative p-5 pt-0 pb-3">
          <p
            className="text-sm leading-relaxed line-clamp-2"
            style={{ color: "rgba(248, 245, 239, 0.78)" }}
          >
            {description}
          </p>
        </CardContent>

        <CardFooter className="relative p-5 pt-0">
          <Button
            variant="secondary"
            size="sm"
            className="w-full group-hover:translate-y-[-1px] group-hover:shadow-soft transition-all duration-260"
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              borderColor: `hsl(${accentHsl} / 0.3)`
            }}
            data-testid={`portal-card-enter-button-${portal.id}`}
          >
            Masuk
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>

        {/* Gold hairline border on hover */}
        <div
          className="absolute inset-0 rounded-[18px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-260"
          style={{
            border: "1px solid var(--ismaya-gold, #C8A96E)"
          }}
        />
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="relative overflow-hidden rounded-[18px] h-[190px]">
          <Skeleton className="absolute inset-0" />
        </Card>
      ))}
    </div>
  );
}

export default function PortalSelection() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Get accessible portals
  const accessiblePortals = user ? visiblePortalsFor(user) : [];

  // Filter portals based on search
  const filteredPortals = searchQuery
    ? accessiblePortals.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : accessiblePortals;

  const handlePortalClick = (portal) => {
    // Save last portal to localStorage
    localStorage.setItem("aurora_last_portal", portal.id);
    
    toast.success(`Membuka portal ${portal.name}`);
    navigate(portal.path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "hsl(var(--background))" }}
        data-testid="portal-select-page"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 w-full">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Empty state - no accessible portals
  if (accessiblePortals.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "hsl(var(--background))" }}
        data-testid="portal-select-page"
      >
        <div className="max-w-md w-full">
          <Alert data-testid="portal-select-empty-state">
            <Sparkles className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold mb-2">Tidak ada portal yang tersedia</AlertTitle>
            <AlertDescription className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Akun Anda saat ini tidak memiliki akses ke portal manapun. Silakan hubungi administrator untuk mengatur permission Anda.
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  data-testid="portal-select-logout-button"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: "hsl(var(--background))" }}
      data-testid="portal-select-page"
    >
      {/* Decorative background overlay (hero radial) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(900px circle at 20% 10%, rgba(200,169,110,0.14) 0%, transparent 55%), radial-gradient(700px circle at 80% 30%, rgba(248,245,239,0.06) 0%, transparent 60%)"
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 w-full relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 sm:mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1
                className="font-['Cormorant_Garamond'] text-4xl sm:text-5xl font-medium leading-[0.95] mb-2"
                style={{ color: "var(--ismaya-cream, #F8F5EF)" }}
              >
                Pilih Portal
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Akses disesuaikan dengan role Anda. Berpindah portal kapan saja dari user menu.
              </p>
            </div>

            {/* User chip on desktop */}
            <div className="hidden sm:flex items-center gap-3 glass-card px-4 py-2.5 rounded-full">
              <div className="h-8 w-8 rounded-full grad-aurora flex items-center justify-center text-white text-xs font-bold">
                {user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "U"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.full_name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          {accessiblePortals.length > 4 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari portal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-input h-11"
                data-testid="portal-select-search"
              />
            </div>
          )}
        </motion.div>

        {/* Portal Cards Grid */}
        <AnimatePresence mode="wait">
          {filteredPortals.length > 0 ? (
            <motion.div
              key="portal-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
            >
              {filteredPortals.map((portal, index) => (
                <PortalCard
                  key={portal.id}
                  portal={portal}
                  index={index}
                  onClick={() => handlePortalClick(portal)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground">Tidak ada portal yang cocok dengan pencarian "{searchQuery}"</p>
              <Button
                variant="link"
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                Reset pencarian
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
