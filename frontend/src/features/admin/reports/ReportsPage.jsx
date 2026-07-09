import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useAnalyticsDaily } from "@/features/admin/analytics/api/useAnalytics";

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

function formatDate(dateKey) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function downloadCsv(rows) {
  const header = ["Date", "Revenue", "Orders", "New Customers", "Low Stock Count"];
  const lines = rows.map((r) => [r.date, r.revenue, r.ordersCount, r.newCustomers, r.lowStockCount].join(","));
  const csv = [header.join(","), ...lines].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `diecastbd-daily-report-${rows[0]?.date ?? "export"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [days, setDays] = useState("30");
  const { data: rows, isLoading } = useAnalyticsDaily(Number(days));

  const totalRevenue = rows?.reduce((sum, r) => sum + r.revenue, 0) ?? 0;
  const totalOrders = rows?.reduce((sum, r) => sum + r.ordersCount, 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Reports</h1>
        <div className="flex items-center gap-3">
          <Select value={days} onValueChange={setDays}>
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
          <Button variant="outline" size="sm" disabled={!rows?.length} onClick={() => downloadCsv(rows)}>
            <Download /> Export CSV
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {formatPrice(totalRevenue)} revenue · {totalOrders} orders over this period
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>New customers</TableHead>
            <TableHead>Low stock count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && rows?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No data yet — the nightly rollup hasn't run since launch.
              </TableCell>
            </TableRow>
          )}
          {[...(rows ?? [])].reverse().map((row) => (
            <TableRow key={row.date}>
              <TableCell>{formatDate(row.date)}</TableCell>
              <TableCell>{formatPrice(row.revenue)}</TableCell>
              <TableCell>{row.ordersCount}</TableCell>
              <TableCell>{row.newCustomers}</TableCell>
              <TableCell>{row.lowStockCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
