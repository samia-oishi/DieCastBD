import { useMemo, useRef, useState } from "react";

const WIDTH = 720;
const HEIGHT = 240;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

function formatDateShort(dateKey) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function RevenueChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const maxRevenue = useMemo(() => Math.max(1, ...data.map((d) => d.revenue)), [data]);

  const points = useMemo(
    () =>
      data.map((d, i) => {
        const x = PAD_LEFT + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth);
        const y = PAD_TOP + plotHeight - (d.revenue / maxRevenue) * plotHeight;
        return { ...d, x, y, index: i };
      }),
    [data, maxRevenue, plotWidth, plotHeight]
  );

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points.at(-1)?.x ?? 0},${PAD_TOP + plotHeight} L${points[0]?.x ?? 0},${PAD_TOP + plotHeight} Z`;

  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  // Peak (best) day — the highest-revenue point gets an emphasized dot and a pill.
  const peak = useMemo(
    () => points.reduce((best, p) => (p.revenue > (best?.revenue ?? -1) ? p : best), null),
    [points]
  );

  function handleMove(e) {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
        No revenue data yet.
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8CD2F" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#A8CD2F" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <line
            key={frac}
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={PAD_TOP + plotHeight * (1 - frac)}
            y2={PAD_TOP + plotHeight * (1 - frac)}
            stroke="#EFEFE9"
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#revenueFill)" stroke="none" />
        <path d={linePath} fill="none" stroke="#7FA31C" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {points.map(
          (p, i) =>
            i % labelStep === 0 && (
              <text key={p.date} x={p.x} y={HEIGHT - 8} textAnchor="middle" className="fill-faint text-[10px]">
                {formatDateShort(p.date)}
              </text>
            )
        )}

        {/* Peak day — ink dot with a white ring (hidden while hovering that same point). */}
        {peak && peak.index !== hoverIndex && (
          <circle cx={peak.x} cy={peak.y} r="4.5" fill="#101208" stroke="#fff" strokeWidth="2.5" />
        )}

        {hovered && (
          <>
            <line x1={hovered.x} x2={hovered.x} y1={PAD_TOP} y2={PAD_TOP + plotHeight} stroke="#DEDFD6" strokeWidth="1" />
            <circle cx={hovered.x} cy={hovered.y} r="4" fill="#7FA31C" stroke="#fff" strokeWidth="2" />
          </>
        )}
      </svg>

      {/* Best-day pill — anchored top-right of the plot. */}
      {peak && data.length > 1 && (
        <div className="pointer-events-none absolute right-0 top-0 rounded-full border border-brand-soft-border bg-brand-tint px-2.5 py-1 text-[10.5px] font-bold text-brand-deep">
          Best day · {formatDateShort(peak.date)} · {formatPrice(peak.revenue)}
        </div>
      )}

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md"
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            transform: hovered.x > WIDTH * 0.7 ? "translateX(-100%)" : "translateX(0)",
          }}
        >
          <p className="text-muted-foreground">{formatDateShort(hovered.date)}</p>
          <p className="font-semibold text-foreground">{formatPrice(hovered.revenue)}</p>
          <p className="text-muted-foreground">{hovered.ordersCount} order{hovered.ordersCount === 1 ? "" : "s"}</p>
        </div>
      )}
    </div>
  );
}
