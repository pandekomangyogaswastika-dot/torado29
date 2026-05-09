import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/contexts/NavigationContext";
import { getPortalSections } from "@/lib/navigationSchema";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function Sidebar() {
  const { currentPortal, sidebarCollapsed, toggleSidebar } = useNavigation();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState(() => {
    // Initialize with saved state or default to all expanded
    const saved = localStorage.getItem("aurora_sidebar_sections");
    return saved ? JSON.parse(saved) : {};
  });
  
  if (!currentPortal) return null;
  
  const sections = getPortalSections(currentPortal.id);
  
  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => {
      const newState = {
        ...prev,
        [sectionId]: !prev[sectionId],
      };
      // Save to localStorage
      localStorage.setItem("aurora_sidebar_sections", JSON.stringify(newState));
      return newState;
    });
  };
  
  const isItemActive = (path) => {
    return location.pathname === path;
  };
  
  const isSectionActive = (section) => {
    return section.items.some((item) => location.pathname === item.path);
  };
  
  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-card/30 backdrop-blur-md transition-all duration-300",
        sidebarCollapsed ? "w-[76px]" : "w-[280px]"
      )}
      data-testid="sidebar"
    >
      {/* Sidebar header with collapse toggle */}
      <div className="h-14 md:h-16 flex items-center justify-between px-4 border-b border-border">
        {!sidebarCollapsed && (
          <span className="text-sm font-semibold truncate">
            {currentPortal.name}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
          data-testid="sidebar-collapse-toggle"
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Sidebar content */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.id] ?? true;
            const isActive = isSectionActive(section);
            
            return (
              <div key={section.id} className="space-y-1">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground bg-foreground/[0.07]"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{section.name}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0" />
                      )}
                    </>
                  )}
                </button>
                
                {/* Section items */}
                {!sidebarCollapsed && isExpanded && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 space-y-0.5 border-l border-border pl-3">
                        {section.items.map((item) => {
                          const isItemActv = isItemActive(item.path);
                          return (
                            <Link
                              key={item.id}
                              to={item.path}
                              className={cn(
                                "block px-3 py-1.5 rounded-md text-sm transition-all duration-150",
                                isItemActv
                                  ? "text-foreground font-semibold bg-foreground/[0.08] border-l-2 border-foreground/30 pl-2.5"
                                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                              )}
                              data-testid={`sidebar-nav-item-${item.id}`}
                            >
                              {item.name}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
      
      {/* Sidebar footer */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            Aurora v0.3.0
          </div>
        </div>
      )}
    </aside>
  );
}
