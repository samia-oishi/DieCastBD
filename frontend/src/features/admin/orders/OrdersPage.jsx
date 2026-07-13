import { useState } from "react";
import { Link } from "react-router";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pagination } from "@/components/shared/Pagination";
import { StatusChip } from "@/components/shared/StatusChip";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminOrders, useDeleteOrdersMutation } from "./api/useAdminOrders";

const STATUS_OPTIONS = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];

// Mirrors the backend's stockBucket() "released" set (order.service.js). Used ONLY to
// preview how many units a delete will hand back — the backend recomputes this itself
// and its number is the one that's authoritative (we report it back from the response).
const RELEASED_STATUSES = ["cancelled", "refunded"];

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
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useAdminOrders({
    page,
    limit: 20,
    status: status === "all" ? undefined : status,
    q: debouncedSearch || undefined,
  });
  const deleteMutation = useDeleteOrdersMutation();

  const orders = data?.data ?? [];
  const meta = data?.meta;

  const selected = orders.filter((o) => selectedIds.includes(o._id));

  // Only live orders (pending = reserved, confirmed..delivered = committed) still hold
  // a claim on inventory; cancelled/refunded hold none, so they give nothing back.
  const unitsReturning = selected
    .filter((o) => !RELEASED_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + o.items.reduce((n, i) => n + i.qty, 0), 0);

  // Selection is per-page and resets whenever the visible set changes, so you can
  // never delete a row you've scrolled away from and can no longer see.
  const resetTo = (fn) => (value) => {
    fn(value);
    setPage(1);
    setSelectedIds([]);
  };

  const allOnPageSelected = orders.length > 0 && orders.every((o) => selectedIds.includes(o._id));
  const someOnPageSelected = orders.some((o) => selectedIds.includes(o._id));

  const toggleAll = () => setSelectedIds(allOnPageSelected ? [] : orders.map((o) => o._id));
  const toggleOne = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onDelete = () => {
    deleteMutation.mutate(selectedIds, {
      onSuccess: (res) => {
        toast.success(res?.message ?? "Orders deleted");
        setSelectedIds([]);
        setConfirmOpen(false);
      },
      onError: (err) => toast.error(err.response?.data?.message ?? "Could not delete orders"),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl">Orders</h1>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search order number..."
          value={search}
          onChange={(e) => resetTo(setSearch)(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={resetTo(setStatus)}>
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

        {selectedIds.length > 0 && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
            <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
              <Trash2 /> Delete
            </Button>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
                onCheckedChange={toggleAll}
                disabled={orders.length === 0}
                aria-label="Select all orders on this page"
              />
            </TableHead>
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
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          )}
          {orders.map((order) => (
            <TableRow key={order._id} data-state={selectedIds.includes(order._id) ? "selected" : undefined}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(order._id)}
                  onCheckedChange={() => toggleOne(order._id)}
                  aria-label={`Select order ${order.orderNumber}`}
                />
              </TableCell>
              <TableCell>
                <Link to={order._id} className="font-mono text-xs hover:text-primary">
                  {order.orderNumber}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {/* Guests can have no email — don't render an empty "()". */}
                {order.user?.name}
                {order.user?.email && <span className="text-xs"> ({order.user.email})</span>}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
              <TableCell>{formatPrice(order.total)}</TableCell>
              <TableCell>
                <StatusChip status={order.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(p) => {
              setPage(p);
              setSelectedIds([]);
            }}
          />
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.length} order{selectedIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                  {selected.map((o) => (
                    <div
                      key={o._id}
                      className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-xs last:border-b-0"
                    >
                      <span className="font-mono">{o.orderNumber}</span>
                      <span className="flex items-center gap-2">
                        <StatusChip status={o.status} />
                        <span className="tabular-nums">{formatPrice(o.total)}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* The consequences, stated plainly — this is irreversible and it moves stock. */}
                {unitsReturning > 0 && (
                  <p className="text-foreground">
                    {unitsReturning} item{unitsReturning === 1 ? "" : "s"} will be returned to stock.
                  </p>
                )}
                <p>
                  This is permanent. These orders will be removed from revenue reports and can&apos;t be
                  recovered from here.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // keep the dialog open until the request resolves
                onDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? "Deleting…"
                : `Delete ${selectedIds.length} order${selectedIds.length === 1 ? "" : "s"}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
