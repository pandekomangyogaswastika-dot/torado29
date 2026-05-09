/**
 * DataList — responsive list component.
 *  - Desktop (sm+): renders as <table> for dense view.
 *  - Mobile (< sm): renders as stacked card list with primary/secondary fields.
 *
 * Usage:
 *   <DataList
 *     columns={[
 *       { key: "date", label: "Tanggal", primary: true, render: (row) => fmtDate(row.date) },
 *       { key: "outlet", label: "Outlet", render: (row) => row.outlet?.name },
 *       { key: "total", label: "Total", numeric: true, render: (row) => fmtRp(row.total) },
 *       { key: "status", label: "Status", render: (row) => <StatusPill status={row.status} /> },
 *     ]}
 *     rows={items}
 *     keyField="id"
 *     onRowClick={(row) => navigate(`/finance/journals/${row.id}`)}
 *     loading={loading}
 *     empty={<EmptyState title="Belum ada data" />}
 *   />
 */
import { cn } from "@/lib/utils";

export default function DataList({
  columns,
  rows,
  keyField = "id",
  onRowClick,
  rowAction,           // (row) => ReactNode rendered at end of card / row
  loading = false,
  loadingNode,         // custom loading state
  empty,               // ReactNode shown when not loading and rows is empty
  className = "",
  rowTestIdPrefix = "row",
}) {
  if (loading) return loadingNode || null;
  if (!rows || rows.length === 0) return empty || null;

  return (
    <div className={cn("overflow-hidden", className)}>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-border/50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    c.numeric && "text-right",
                    c.headerClass,
                  )}
                  scope="col"
                >
                  {c.label}
                </th>
              ))}
              {rowAction && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row[keyField] ?? idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border/30 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-foreground/5",
                )}
                data-testid={`${rowTestIdPrefix}-${row[keyField] ?? idx}`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-3",
                      c.numeric && "text-right tabular-nums",
                      c.cellClass,
                    )}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
                {rowAction && (
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {rowAction(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card */}
      <div className="sm:hidden divide-y divide-border/30">
        {rows.map((row, idx) => {
          const primary = columns.find((c) => c.primary);
          const rest = columns.filter((c) => !c.primary && !c.hideOnMobile);
          return (
            <div
              key={row[keyField] ?? idx}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === "Enter") onRowClick(row); } : undefined}
              className={cn(
                "p-4 transition-colors",
                onRowClick && "cursor-pointer hover:bg-foreground/5 active:bg-foreground/10",
              )}
              data-testid={`${rowTestIdPrefix}-card-${row[keyField] ?? idx}`}
            >
              {primary && (
                <div className="font-semibold text-base mb-1.5">
                  {primary.render ? primary.render(row) : row[primary.key]}
                </div>
              )}
              <div className="grid grid-cols-1 gap-1.5">
                {rest.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
                    <span className={cn("text-right", c.numeric && "tabular-nums font-medium")}>
                      {c.render ? c.render(row) : row[c.key]}
                    </span>
                  </div>
                ))}
              </div>
              {rowAction && (
                <div className="mt-3 pt-3 border-t border-border/30 flex justify-end" onClick={(e) => e.stopPropagation()}>
                  {rowAction(row)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
