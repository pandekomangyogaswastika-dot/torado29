/** PageHeader — consistent portal page title with icon + optional subtitle + action slot. */
import { cn } from "@/lib/utils";

export default function PageHeader({ icon: Icon, title, subtitle, action, colorClass = "grad-aurora" }) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap mb-5 lg:mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
            <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 ml-auto">{action}</div>}
    </div>
  );
}
