import { useState } from "react";
import { Link } from "react-router";

import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/shared/Pagination";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminOrders } from "./api/useAdminOrders";

const STATUS_OPTIONS = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useAdminOrders({
    page,
    limit: 20,
    status: status === "all" ? undefined : status,
    q: debouncedSearch || undefined,
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl">Orders</h1>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search order number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
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
          {!isLoading && orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          )}
          {orders.map((order) => (
            <TableRow key={order._id} className="cursor-pointer">
              <TableCell>
                <Link to={order._id} className="font-mono text-xs hover:text-primary">
                  {order.orderNumber}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {order.user?.name} <span className="text-xs">({order.user?.email})</span>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
              <TableCell>{formatPrice(order.total)}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
