import { useMemo, useRef, useState } from "react";

import { toWeekly, WEEKLY_ABOVE } from "./revenueChartData";

const WIDTH = 720;
const HEIGHT = 260;
const PAD_TOP = 18;
const PAD_BOTTOM = 30;
// Wide enough for a "৳1.2L" axis label without clipping.
const PAD_LEFT = 46;
const PAD_RIGHT = 10;

const INK = "#101208";
const LIME = "#A8CD2F";
const LIME_DEEP = "#7FA31C";
const COST = "#DEDFD6";
const LOSS = "#B3261E";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Compact money for the y-axis, in the units this shop actually thinks in —
 * lakh, not millions. A full "৳1,25,830" on every gridline would need more
 * horizontal room than the plot itself. */
function formatAxis(amount) {
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(amount >= 1000000 ? 0 : 1)}L`;
  if (amount >= 1000) return `৳${Math.round(amount / 1000)}k`;
  return `৳${Math.round(amount)}`;
}

function formatDateShort(dateKey) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function Legend() {
  return (
    <div className="mb-2 flex items-center gap-4 text-[11px] text-faint">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px]" style={{ background: LIME }} /> Profit
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px]" style={{ background: COST }} /> Cost of goods
      </span>
      <span className="text-[10.5px]">· bar height = revenue</span>
    </div>
  );
}

/** Revenue broken into what it cost and what it earned, one bar per day (or per
 * week on the longer ranges).
 *
 * Bars, not a line: on this shop's data most days have no order at all, and a
 * line interpolates straight through those zeros — it draws a continuous trend
 * where the truth is occasional spikes. A bar for a zero day is visibly nothing,
 * which is the honest reading.
 *
 * Stacked rather than two series side by side because revenue and profit are
 * not independent quantities: profit is a PART of revenue, and stacking says so.
 * It also makes margin legible at a glance — the lime share of each bar IS the
 * margin — which a revenue-only chart could never show. Two days with identical
 * revenue and very different margins used to look identical here. */
export function RevenueChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const weekly = data.length > WEEKLY_ABOVE;
  const rows = useMemo(() => (weekly ? toWeekly(data) : data), [data, weekly]);

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const maxRevenue = useMemo(() => Math.max(1, ...rows.map((d) => d.revenue ?? 0)), [rows]);

  const bars = useMemo(() => {
    const slot = plotWidth / Math.max(1, rows.length);
    // Cap the width so a 7-day range doesn't render seven fat slabs.
    const barWidth = Math.max(2, Math.min(slot * 0.68, 46));
    return rows.map((d, i) => {
      const revenue = d.revenue ?? 0;
      const cogs = d.cogs ?? 0;
      const profit = revenue - cogs;
      const loss = profit < 0;
      // Segments must always add up to the bar's total height, so a loss day
      // draws as one solid red bar rather than a negative slice hanging off it.
      const profitH = (Math.max(0, profit) / maxRevenue) * plotHeight;
      const totalH = (revenue / maxRevenue) * plotHeight;
      return {
        ...d,
        profit,
        loss,
        index: i,
        x: PAD_LEFT + slot * i + (slot - barWidth) / 2,
        centerX: PAD_LEFT + slot * i + slot / 2,
        width: barWidth,
        totalH,
        profitH,
        costH: Math.max(0, totalH - profitH),
        top: PAD_TOP + plotHeight - totalH,
      };
    });
  }, [rows, maxRevenue, plotWidth, plotHeight]);

  const peak = useMemo(
    () => bars.reduce((best, b) => (b.revenue > (best?.revenue ?? -1) ? b : best), null),
    [bars]
  );

  const labelStep = Math.max(1, Math.ceil(bars.length / 7));

  function handleMove(e) {
    if (!svgRef.current || bars.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    bars.forEach((b, i) => {
      const dist = Math.abs(b.centerX - relX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  const hovered = hoverIndex !== null ? bars[hoverIndex] : null;

  if (data.length === 0) {
    return <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">No revenue data yet.</div>;
  }

  return (
    <div className="relative">
      <Legend />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Gridlines, now with the values they stand for — the shape of the
            chart was readable before, the magnitude was not. */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD_TOP + plotHeight * (1 - frac);
          return (
            <g key={frac}>
              <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke="#EFEFE9" strokeWidth="1" />
              <text x={PAD_LEFT - 8} y={y + 3.5} textAnchor="end" className="fill-faint text-[10px]">
                {formatAxis(maxRevenue * frac)}
              </text>
            </g>
          );
        })}

        {bars.map((b) => (
          <g key={b.date}>
            {/* Invisible full-height hit area so hovering a zero day still works. */}
            <rect x={b.x} y={PAD_TOP} width={b.width} height={plotHeight} fill="transparent" />
            {b.totalH > 0 && (
              <>
                <rect x={b.x} y={b.top} width={b.width} height={b.costH} fill={b.loss ? LOSS : COST} rx="2" />
                {!b.loss && b.profitH > 0 && (
                  <rect
                    x={b.x}
                    y={b.top}
                    width={b.width}
                    height={b.profitH}
                    fill={hovered?.index === b.index ? LIME_DEEP : LIME}
                    rx="2"
                  />
                )}
              </>
            )}
          </g>
        ))}

        {bars.map((b, i) => {
          if (i % labelStep !== 0) return null;
          const anchor = b.centerX < PAD_LEFT + 24 ? "start" : b.centerX > WIDTH - PAD_RIGHT - 24 ? "end" : "middle";
          return (
            <text key={b.date} x={b.centerX} y={HEIGHT - 9} textAnchor={anchor} className="fill-faint text-[10px]">
              {formatDateShort(b.date)}
            </text>
          );
        })}

        {peak && peak.revenue > 0 && peak.index !== hoverIndex && (
          <circle cx={peak.centerX} cy={peak.top - 7} r="3" fill={INK} />
        )}
      </svg>

      {peak && peak.revenue > 0 && bars.length > 1 && !hovered && (
        <div className="pointer-events-none absolute right-2 top-0 rounded-full border border-brand-soft-border bg-brand-tint px-3 py-1 text-[11px] font-bold text-brand-deep shadow-[0_2px_8px_rgba(16,18,8,0.06)]">
          Best {weekly ? "week" : "day"} · {formatDateShort(peak.date)} · {formatPrice(peak.revenue)}
        </div>
      )}

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md"
          style={{
            left: `${(hovered.centerX / WIDTH) * 100}%`,
            transform: hovered.centerX > WIDTH * 0.7 ? "translateX(-100%)" : "translateX(0)",
          }}
        >
          <p className="text-muted-foreground">
            {weekly ? "Week of " : ""}
            {formatDateShort(hovered.date)}
          </p>
          <p className="font-semibold text-foreground">{formatPrice(hovered.revenue)} revenue</p>
          <p className={hovered.loss ? "font-semibold text-[#B3261E]" : "text-muted-foreground"}>
            {formatPrice(hovered.profit)} profit
            {hovered.revenue > 0 && !hovered.loss ? ` · ${Math.round((hovered.profit / hovered.revenue) * 100)}%` : ""}
          </p>
          <p className="text-muted-foreground">
            {hovered.ordersCount} order{hovered.ordersCount === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}
