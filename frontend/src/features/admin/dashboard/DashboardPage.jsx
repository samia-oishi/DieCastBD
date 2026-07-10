import { useState } from "react";
import { Link } from "react-router";
import { Wallet, ShoppingCart, TriangleAlert, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { useAnalyticsSummary, useAnalyticsDaily, useAnalyticsDailyRange } from "@/features/admin/analytics/api/useAnalytics";
import { RevenueChart } from "@/features/admin/analytics/components/RevenueChart";

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

function StatCard({ icon: Icon, label, value, sublabel }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-heading text-2xl text-foreground">{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary();

  const [range, setRange] = useState("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // "Today" reuses the already-live-computed summary.today instead of the daily-
  // rollup endpoint — the nightly rollup hasn't run for today yet, so a range
  // query for today's date would come back empty even with real sales today.
  const { data: presetRows, isLoading: presetLoading } = useAnalyticsDaily(range === "7" ? 7 : 30);
  const { data: rangeRows, isLoading: rangeLoading } = useAnalyticsDailyRange(
    range === "custom" ? customStart : undefined,
    range === "custom" ? customEnd : undefined
  );

  if (summaryLoading) return <FullPageLoader />;

  const today = summary?.today;
  const week = summary?.last7Days;

  const chartRows =
    range === "today" ? (today ? [today] : []) : range === "custom" ? (rangeRows ?? []) : presetRows ?? [];
  const chartLoading = range === "today" ? false : range === "custom" ? rangeLoading : presetLoading;
  const chartRevenue = chartRows.reduce((sum, r) => sum + r.revenue, 0);
  const chartOrders = chartRows.reduce((sum, r) => sum + r.ordersCount, 0);
  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Today's revenue" value={formatPrice(today?.revenue ?? 0)} sublabel={`${today?.ordersCount ?? 0} orders today`} />
        <StatCard icon={ShoppingCart} label="Last 7 days revenue" value={formatPrice(week?.revenue ?? 0)} sublabel={`${week?.ordersCount ?? 0} orders`} />
        <StatCard icon={Users} label="New customers today" value={today?.newCustomers ?? 0} />
        <StatCard
          icon={TriangleAlert}
          label="Low stock products"
          value={today?.lowStockCount ?? 0}
          sublabel={today?.lowStockCount > 0 ? "≤ 2 units left" : "All good"}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg">Revenue &amp; Orders — {rangeLabel}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {range === "custom" && (
              <>
                <Input type="date" className="w-[150px]" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                <Input type="date" className="w-[150px]" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
              </>
            )}
          </div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {formatPrice(chartRevenue)} revenue · {chartOrders} orders over this period
        </p>

        {chartLoading ? (
          <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <RevenueChart data={chartRows} />
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-heading text-lg">Top products today</h2>
        {today?.topProducts?.length ? (
          <ul className="flex flex-col gap-2 text-sm">
            {today.topProducts.map((p) => (
              <li key={p.product} className="flex justify-between border-b border-border pb-2 last:border-0">
                <Link to={`/admin/products/${p.product}`} className="text-foreground hover:text-primary">
                  {p.title}
                </Link>
                <span className="text-muted-foreground">{p.unitsSold} sold</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No sales yet today.</p>
        )}
      </div>
    </div>
  );
}
