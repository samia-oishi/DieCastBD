import { useState } from "react";
import { Link } from "react-router";
import { Download } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { FilterChips } from "@/features/admin/shell/FilterChips";
import { useAnalyticsDaily } from "@/features/admin/analytics/api/useAnalytics";

const GRID = "grid-cols-[92px_repeat(4,minmax(84px,1fr))_64px_60px_minmax(110px,1.2fr)]";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

function formatDate(dateKey) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

/** Profit for a rollup row. The API sends it as a virtual, but it is exactly
 * revenue − cogs, so this recomputes rather than trusting a field that could
 * be absent on rows written before the column existed. */
const profitOf = (r) => (r.revenue ?? 0) - (r.cogs ?? 0);

function downloadCsv(rows, days) {
  // Must stay in step with the table columns below — updating one and
  // forgetting the other is the easy mistake here.
  const header = ["Date", "Total sales", "Delivery collected", "Revenue", "Cost of goods", "Profit", "Units sold", "Orders", "New customers", "Low stock"];
  const lines = rows.map((r) =>
    [r.date, r.totalSales ?? 0, r.shippingFees ?? 0, r.revenue ?? 0, r.cogs ?? 0, profitOf(r), r.unitsSold ?? 0, r.ordersCount, r.newCustomers, r.lowStockCount].join(",")
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `diecastbd-daily-report-last-${days}-days.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function Kpi({ label, value, sub, tone }) {
  return (
    <div className="rounded-[14px] border border-line bg-white px-4 py-[13px]">
      <div className="text-[11px] font-semibold text-[#6B6E60]">{label}</div>
      <div className={cn("mt-[5px] font-display text-[21px] font-extrabold tracking-[-0.02em]", tone === "red" ? "text-[#B3261E]" : "text-ink")}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-faint">{sub}</div>}
    </div>
  );
}

export function ReportsPage() {
  const [days, setDays] = useState("30");
  const { data, isLoading } = useAnalyticsDaily(Number(days));

  const rows = data ?? [];
  const sum = (pick) => rows.reduce((n, r) => n + (pick(r) ?? 0), 0);
  const totalSales = sum((r) => r.totalSales);
  const totalShipping = sum((r) => r.shippingFees);
  const totalRevenue = sum((r) => r.revenue);
  const totalCogs = sum((r) => r.cogs);
  const totalProfit = totalRevenue - totalCogs;
  const totalUnits = sum((r) => r.unitsSold);
  const totalOrders = sum((r) => r.ordersCount);
  const totalNewCustomers = sum((r) => r.newCustomers);
  const unitsMissingCost = sum((r) => r.unitsMissingCost);
  const margin = totalRevenue ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : null;

  // The share bar is measured against the period's best day, not the total —
  // otherwise every bar is a sliver and no day stands out. It tracks profit now,
  // since that is the number the merchant is actually judging a day by.
  const peakProfit = rows.reduce((max, r) => Math.max(max, Math.abs(profitOf(r))), 0);

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

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        <Kpi label="Total sales" value={formatTaka(totalSales)} sub={`incl. ${formatTaka(totalShipping)} delivery`} />
        <Kpi label="Revenue" value={formatTaka(totalRevenue)} sub="after delivery charge" />
        <Kpi
          label="Profit"
          value={formatTaka(totalProfit)}
          tone={totalProfit < 0 ? "red" : undefined}
          sub={margin != null ? `${margin}% margin` : "No sales yet"}
        />
        <Kpi label="Items sold" value={totalUnits} sub={`${totalOrders} order${totalOrders === 1 ? "" : "s"}`} />
        <Kpi label="New customers" value={totalNewCustomers} />
        <Kpi
          label="Avg. order value"
          value={formatTaka(totalOrders ? Math.round(totalSales / totalOrders) : 0)}
          sub="what a customer pays"
        />
      </div>

      {unitsMissingCost > 0 && (
        /* Profit is understated rather than wrong — say so instead of letting
           the merchant read a number that quietly excludes some cost. */
        <p className="rounded-[12px] border border-[#F0D9B5] bg-[#FDF8EF] px-4 py-2.5 text-[12.5px] text-[#8A5A12]">
          {unitsMissingCost} item{unitsMissingCost === 1 ? " was" : "s were"} sold without a cost price recorded, so profit
          here is understated. Add cost prices in{" "}
          <Link to="/admin/inventory" className="font-semibold underline">
            Inventory
          </Link>{" "}
          to complete it.
        </p>
      )}

      <section className="overflow-x-auto rounded-[18px] border border-line bg-white">
        <div className="min-w-[720px]">
          <div className={cn("grid items-center gap-2.5 border-b border-line-soft px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-faint", GRID)}>
            <span>Date</span>
            <span className="text-right">Total sales</span>
            <span className="text-right">Revenue</span>
            <span className="text-right">Cost</span>
            <span className="text-right">Profit</span>
            <span className="text-right">Items</span>
            <span className="text-right">Orders</span>
            <span>Profit share</span>
          </div>

          {isLoading && <p className="px-5 py-10 text-center text-[13.5px] text-faint">Loading…</p>}
          {!isLoading && tableRows.length === 0 && (
            <p className="px-5 py-10 text-center text-[13.5px] text-faint">
              No data for this range yet — the nightly rollup fills this in as orders come through.
            </p>
          )}

          {tableRows.map((r) => {
            const profit = profitOf(r);
            return (
              <div key={r.date} className={cn("grid items-center gap-2.5 border-b border-line-soft px-5 py-2 last:border-b-0", GRID)}>
                <span className="text-[12.5px] font-semibold text-ink">{formatDate(r.date)}</span>
                {/* Zero-sale days dim so the days that earned stand out. */}
                <span className={cn("text-right text-[12.5px]", r.totalSales ? "text-[#6B6E60]" : "text-[#B7BAAD]")}>
                  {formatTaka(r.totalSales ?? 0)}
                </span>
                <span className={cn("text-right text-[12.5px] font-semibold", r.revenue ? "text-ink" : "text-[#B7BAAD]")}>
                  {formatTaka(r.revenue ?? 0)}
                </span>
                <span className={cn("text-right text-[12.5px]", r.cogs ? "text-[#6B6E60]" : "text-[#B7BAAD]")}>
                  {formatTaka(r.cogs ?? 0)}
                </span>
                <span className={cn("text-right text-[12.5px] font-bold", profit < 0 ? "text-[#B3261E]" : profit ? "text-ink" : "text-[#B7BAAD]")}>
                  {formatTaka(profit)}
                </span>
                <span className="text-right text-[12.5px] text-[#6B6E60]">{r.unitsSold ?? 0}</span>
                <span className="text-right text-[12.5px] text-[#6B6E60]">{r.ordersCount}</span>
                <span className="block h-[6px] overflow-hidden rounded-full bg-[#F1F2EA]">
                  <span
                    className={cn("block h-full rounded-full", profit < 0 ? "bg-[#B3261E]" : "bg-brand")}
                    style={{ width: peakProfit ? `${Math.round((Math.abs(profit) / peakProfit) * 100)}%` : "0%" }}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-[12px] text-faint">
        Total sales is what customers paid. Revenue takes off the delivery charge your courier keeps, and profit takes off
        what the goods cost you. The bar shows each day&apos;s profit against the period&apos;s best day.
      </p>
    </div>
  );
}
