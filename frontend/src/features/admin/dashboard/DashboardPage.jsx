import { Link } from "react-router";
import { Wallet, ShoppingCart, TriangleAlert, Users } from "lucide-react";

import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { useAnalyticsSummary, useAnalyticsDaily } from "@/features/admin/analytics/api/useAnalytics";
import { RevenueChart } from "@/features/admin/analytics/components/RevenueChart";

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
  const { data: daily, isLoading: dailyLoading } = useAnalyticsDaily(30);

  if (summaryLoading || dailyLoading) return <FullPageLoader />;

  const today = summary?.today;
  const week = summary?.last7Days;

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
        <h2 className="mb-4 font-heading text-lg">Revenue — last 30 days</h2>
        <RevenueChart data={daily ?? []} />
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
