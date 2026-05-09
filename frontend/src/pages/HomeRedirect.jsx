/** Default landing route after login — redirects to portal selection or user's portal. */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { visiblePortalsFor } from "@/lib/portals";

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    
    const portals = visiblePortalsFor(user);
    
    // No accessible portals → no-access page
    if (portals.length === 0) {
      navigate("/no-access", { replace: true });
      return;
    }
    
    // Check remember_last_portal preference from localStorage
    const rememberLastPortal = localStorage.getItem("aurora_remember_last_portal") === "true";
    const lastPortalId = localStorage.getItem("aurora_last_portal");
    
    // If remember is enabled and last portal exists and is accessible → go directly
    if (rememberLastPortal && lastPortalId) {
      const lastPortal = portals.find((p) => p.id === lastPortalId);
      if (lastPortal) {
        navigate(lastPortal.path, { replace: true });
        return;
      }
    }
    
    // Single portal → auto-enter
    if (portals.length === 1) {
      localStorage.setItem("aurora_last_portal", portals[0].id);
      navigate(portals[0].path, { replace: true });
      return;
    }
    
    // Multiple portals → show portal selection
    navigate("/portal-select", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card px-6 py-4 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full grad-aurora animate-pulse" />
        <span className="text-sm text-muted-foreground">Mengarahkan…</span>
      </div>
    </div>
  );
}
