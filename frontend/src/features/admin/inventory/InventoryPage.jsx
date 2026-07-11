import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { History, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminInventory, useProductInventoryLogs, useAdjustStockMutation } from "./api/useAdminInventory";

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AdjustStockDialog({ product, onClose }) {
  const adjustMutation = useAdjustStockMutation();
  const { register, handleSubmit, control, watch, reset } = useForm({
    defaultValues: { type: "restock", quantityChange: "", reason: "" },
  });
  const type = watch("type");

  const onSubmit = (values) => {
    const signedQty = type === "restock" ? Math.abs(Number(values.quantityChange)) : Number(values.quantityChange);
    if (!signedQty) return toast.error("Enter a non-zero quantity");

    toast.promise(
      adjustMutation.mutateAsync({ productId: product.id, payload: { type, quantityChange: signedQty, reason: values.reason } }),
      {
        loading: "Saving...",
        success: () => {
          reset();
          onClose();
          return "Stock updated";
        },
        error: (err) => err.response?.data?.message ?? "Could not update stock",
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {product.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Current: {product.stock} in stock, {product.reservedStock} reserved, {product.availableStock} available.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restock">Restock (add units)</SelectItem>
                      <SelectItem value="adjustment">Adjustment (correction, +/-)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="quantityChange">
                {type === "restock" ? "Units to add" : "Quantity change (use - to subtract)"}
              </FieldLabel>
              <Input id="quantityChange" type="number" {...register("quantityChange")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="reason">Reason</FieldLabel>
              <Input id="reason" placeholder="e.g. New shipment arrived, recount correction..." {...register("reason", { required: true })} />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={adjustMutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ product, onClose }) {
  const { data: logs, isLoading } = useProductInventoryLogs(product.id);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock history — {product.title}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto text-sm">
          {isLoading && <p className="text-muted-foreground">Loading...</p>}
          {!isLoading && logs?.length === 0 && <p className="text-muted-foreground">No history yet.</p>}
          {logs?.map((log) => (
            <div key={log._id} className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <p className="capitalize text-foreground">
                  {log.type} <span className="text-muted-foreground">{log.reason ? `— ${log.reason}` : ""}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                  {log.performedBy?.name && ` · ${log.performedBy.name}`}
                  {log.referenceOrder?.orderNumber && ` · ${log.referenceOrder.orderNumber}`}
                </p>
              </div>
              <span className={log.quantityChange > 0 ? "text-primary" : "text-destructive"}>
                {log.quantityChange > 0 ? "+" : ""}
                {log.quantityChange}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);

  const { data, isLoading } = useAdminInventory({
    page,
    limit: 20,
    q: debouncedSearch || undefined,
    lowStockOnly: lowStockOnly || undefined,
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl">Inventory</h1>

      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search title or SKU..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch
            checked={lowStockOnly}
            onCheckedChange={(v) => {
              setLowStockOnly(v);
              setPage(1);
            }}
          />
          Low stock only (≤ {meta?.lowStockThreshold ?? 2} available)
        </label>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Reserved</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Waiting</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No products found.
              </TableCell>
            </TableRow>
          )}
          {items.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                {product.thumbnail?.url ? (
                  <img src={product.thumbnail.url} alt="" className="size-8 rounded object-cover" />
                ) : (
                  <div className="size-8 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell className="font-medium">{product.title}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell className="text-muted-foreground">{product.reservedStock}</TableCell>
              <TableCell>
                <span className={product.isLowStock ? "font-medium text-destructive" : ""}>{product.availableStock}</span>
                {product.isLowStock && (
                  <Badge variant="destructive" className="ml-2">
                    Low
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.restockAlertCount > 0 ? `${product.restockAlertCount} waiting` : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Stock history" onClick={() => setHistoryProduct(product)}>
                    <History />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Adjust stock" onClick={() => setAdjustingProduct(product)}>
                    <PackagePlus />
                  </Button>
                </div>
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

      {adjustingProduct && <AdjustStockDialog product={adjustingProduct} onClose={() => setAdjustingProduct(null)} />}
      {historyProduct && <HistoryDialog product={historyProduct} onClose={() => setHistoryProduct(null)} />}
    </div>
  );
}
