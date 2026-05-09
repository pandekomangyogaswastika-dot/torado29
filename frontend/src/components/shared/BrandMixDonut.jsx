/**
 * BrandMixDonut — SVG donut chart for brand revenue mix.
 * Props:
 *   - rows: [{brand_id, brand_name, total, share_pct, color}]
 *   - onSliceClick(brand_id)
 *   - size: width/height in px
 */
import { useState } from "react";
import { fmtRp } from "@/lib/format";
import { cn } from "@/lib/utils";

const DEFAULT_COLORS = [
  "#5B5FE3", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16",
];

export default function BrandMixDonut({ rows = [], onSliceClick, size = 180 }) {
  const [hovered, setHovered] = useState(null);
  const grandTotal = rows.reduce((s, r) => s + (r.total || 0), 0);

  if (!rows.length || grandTotal <= 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground italic py-4">
        Belum ada data brand mix periode ini.
      </div>
    );
  }

  // Build arcs
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const innerR = r * 0.62;

  let cumPct = 0;
  const slices = rows.map((row, i) => {
    const pct = (row.total / grandTotal) || 0;
    const start = cumPct;
    const end = cumPct + pct;
    cumPct = end;

    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = end * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + innerR * Math.cos(endAngle);
    const yi1 = cy + innerR * Math.sin(endAngle);
    const xi2 = cx + innerR * Math.cos(startAngle);
    const yi2 = cy + innerR * Math.sin(startAngle);
    const largeArc = pct > 0.5 ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${xi1} ${yi1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi2} ${yi2}`,
      "Z",
    ].join(" ");

    return {
      ...row,
      path,
      color: row.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    };
  });

  const focused = hovered != null ? slices[hovered] : null;

  return (
    <div className="flex flex-col items-center" data-testid="brand-mix-donut">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((s, i) => (
            <path
              key={s.brand_id}
              d={s.path}
              fill={s.color}
              opacity={hovered != null && hovered !== i ? 0.35 : 1}
              className="transition-opacity cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSliceClick && onSliceClick(s.brand_id)}
              data-testid={`donut-slice-${s.brand_id}`}
            >
              <title>{`${s.brand_name}: ${fmtRp(s.total)} (${s.share_pct?.toFixed?.(1) ?? "0"}%)`}</title>
            </path>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {focused ? focused.brand_name : "Total"}
          </div>
          <div className="text-base font-bold tabular-nums">
            {focused ? `${focused.share_pct?.toFixed?.(1) ?? "0"}%` : fmtRp(grandTotal)}
          </div>
          {focused && (
            <div className="text-[10px] text-muted-foreground tabular-nums">{fmtRp(focused.total)}</div>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 w-full">
        {slices.map((s, i) => (
          <button
            key={s.brand_id}
            onClick={() => onSliceClick && onSliceClick(s.brand_id)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors text-left w-full",
              "hover:bg-foreground/5",
            )}
            data-testid={`donut-legend-${s.brand_id}`}
          >
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            <span className="flex-1 truncate font-medium">{s.brand_name}</span>
            <span className="text-muted-foreground tabular-nums shrink-0">
              {(s.share_pct ?? 0).toFixed(1)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
