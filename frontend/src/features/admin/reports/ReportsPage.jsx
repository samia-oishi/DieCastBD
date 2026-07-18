import { useState } from "react";
import { Download } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { FilterChips } from "@/features/admin/shell/FilterChips";
import { useAnalyticsDaily } from "@/features/admin/analytics/api/useAnalytics";

const GRID = "grid-cols-[110px_minmax(90px,1fr)_70px_110px_100px_minmax(120px,1.4fr)]";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

function formatDate(dateKey) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function downloadCsv(rows, days) {
  const header = ["Date", "Revenue", "Orders", "New customers", "Low stock"];
  const lines = rows.map((r) => [r.date, r.revenue, r.ordersCount, r.newCustomers, r.lowStockCount].join(","));
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `diecastbd-daily-report-last-${days}-days.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function Kpi({ label, value }) {
  return (
    <div className="rounded-[14px] border border-line bg-white px-4 py-[13px]">
      <div className="text-[11px] font-semibold text-[#6B6E60]">{label}</div>
      <div className="mt-[5px] font-display text-[21px] font-extrabold tracking-[-0.02em] text-ink">{value}</div>
    </div>
  );
}

export function ReportsPage() {
  const [days, setDays] = useState("30");
  const { data, isLoading } = useAnalyticsDaily(Number(days));

  const rows = data ?? [];
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const totalOrders = rows.reduce((sum, r) => sum + r.ordersCount, 0);
  const totalNewCustomers = rows.reduce((sum, r) => sum + r.newCustomers, 0);

  // The share bar is measured against the period's best day, not the total —
  // otherwise every bar is a sliver and no day stands out.
  const peakRevenue = rows.reduce((max, r) => Math.max(max, r.revenue), 0);

  // API returns oldest-first (the chart needs that order); the table reads
  // newest-first, which is how the old page showed it.
  const tableRows = [...rows].reverse();

  return (
    <div className="flex flex-col gap-[18px]">
      <AdminPageHeader
        eyebrow="Daily performance"
        title="Reports"
        actions={
          <>
            <FilterChips chips={RANGES} value={days} onChange={setDays} />
            <AdminButton variant="outline" disabled={!rows.length} onClick={() => downloadCsv(rows, days)}>
              <Download size={14} strokeWidth={2} /> Export CSV
            </AdminButton>
          </>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <Kpi label="Revenue" value={formatTaka(totalRevenue)} />
        <Kpi label="Orders" value={totalOrders} />
        <Kpi label="New customers" value={totalNewCustomers} />
        <Kpi label="Avg. order value" value={formatTaka(totalOrders ? Math.round(totalRevenue / totalOrders) : 0)} />
      </div>

      <section className="overflow-x-auto rounded-[18px] border border-line bg-white">
        <div className="min-w-[720px]">
          <div className={cn("grid items-center gap-2.5 border-b border-line-soft px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-faint", GRID)}>
            <span>Date</span>
            <span className="text-right">Revenue</span>
            <span className="text-right">Orders</span>
            <span className="text-right">New customers</span>
            <span className="text-right">Low stock</span>
            <span>Revenue share</span>
          </div>

          {isLoading && <p className="px-5 py-10 text-center text-[13.5px] text-faint">Loading…</p>}
          {!isLoading && tableRows.length === 0 && (
            <p className="px-5 py-10 text-center text-[13.5px] text-faint">
              No data for this range yet — the nightly rollup fills this in as orders come through.
            </p>
          )}

          {tableRows.map((r) => (
            <div key={r.date} className={cn("grid items-center gap-2.5 border-b border-line-soft px-5 py-2 last:border-b-0", GRID)}>
              <span className="text-[12.5px] font-semibold text-ink">{formatDate(r.date)}</span>
              {/* Zero-revenue days dim so the days that earned stand out. */}
              <span className={cn("text-right text-[12.5px] font-bold", r.revenue ? "text-ink" : "text-[#B7BAAD]")}>
                {formatTaka(r.revenue)}
              </span>
              <span className="text-right text-[12.5px] text-[#6B6E60]">{r.ordersCount}</span>
              <span className="text-right text-[12.5px] text-[#6B6E60]">{r.newCustomers}</span>
              <span className={cn("text-right text-[12.5px]", r.lowStockCount ? "font-semibold text-[#B45309]" : "text-[#6B6E60]")}>
                {r.lowStockCount}
              </span>
              <span className="block h-[6px] overflow-hidden rounded-full bg-[#F1F2EA]">
                <span
                  className="block h-full rounded-full bg-brand"
                  style={{ width: peakRevenue ? `${Math.round((r.revenue / peakRevenue) * 100)}%` : "0%" }}
                />
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[12px] text-faint">
        The bar shows each day&apos;s share of the period&apos;s best day — spot your strong days at a glance.
      </p>
    </div>
  );
}
