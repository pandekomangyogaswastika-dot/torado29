import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/contexts/NavigationContext";
import { getPortalSections } from "@/lib/navigationSchema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function MobileSidebar() {
  const { currentPortal, mobileDrawerOpen, closeMobileDrawer } = useNavigation();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState(() => {
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
  
  const handleItemClick = () => {
    closeMobileDrawer();
  };
  
  return (
    <Sheet open={mobileDrawerOpen} onOpenChange={closeMobileDrawer}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="px-4 py-4 border-b border-border">
          <SheetTitle className="text-left">{currentPortal.name}</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)] px-3 py-4">
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
                    <span className="flex-1 text-left truncate">{section.name}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    )}
                  </button>
                  
                  {/* Section items */}
                  {isExpanded && (
                    <div className="ml-6 space-y-0.5 border-l border-border pl-3">
                      {section.items.map((item) => {
                        const isItemActv = isItemActive(item.path);
                        return (
                          <Link
                            key={item.id}
                            to={item.path}
                            onClick={handleItemClick}
                            className={cn(
                              "block px-3 py-1.5 rounded-md text-sm transition-all duration-150",
                              isItemActv
                                ? "text-foreground font-semibold bg-foreground/[0.08] border-l-2 border-foreground/30 pl-2.5"
                                : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
                            )}
                          >
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
