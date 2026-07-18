import { useForm, Controller } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AdminModal } from "@/features/admin/shell/AdminModal";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { adminInputCls, adminSelectCls } from "@/features/admin/shell/adminFieldCls";
import { adminToast } from "@/features/admin/shell/adminToast";
import { useAdjustStockMutation } from "../api/useAdminInventory";

// The three ways stock actually changes. "recount" is a SET (not a delta), so the
// signed change sent to the API is computed from the current stock.
const TYPES = [
  { value: "restock", label: "Restock — add units" },
  { value: "recount", label: "Recount — set exact count" },
  { value: "damaged", label: "Damaged / lost — remove units" },
];

export function AdjustStockDialog({ product, onClose }) {
  const adjust = useAdjustStockMutation();
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: { type: "restock", units: "", reason: "" },
  });

  const type = watch("type");
  const units = Number(watch("units")) || 0;

  // Preview the resulting stock, per the design's lime "After saving" box.
  const nextStock =
    type === "recount" ? units : type === "damaged" ? product.stock - units : product.stock + units;
  const invalid = units <= 0 || nextStock < 0;

  const onSubmit = (values) => {
    if (units <= 0) return adminToast("Enter a quantity above zero");
    if (nextStock < 0) return adminToast("That would take stock below zero");

    // The API takes a signed delta plus a log type; recount becomes the delta
    // needed to reach the exact number the admin typed.
    const quantityChange =
      values.type === "recount" ? nextStock - product.stock : values.type === "damaged" ? -units : units;
    if (quantityChange === 0) return adminToast("Stock is already at that number");

    adjust.mutate(
      {
        productId: product.id,
        payload: {
          type: values.type === "restock" ? "restock" : "adjustment",
          quantityChange,
          reason: values.reason || undefined,
        },
      },
      {
        onSuccess: () => {
          // Restocking something people are waiting on notifies them (backend
          // notifyRestockSubscribers), so say so.
          adminToast(
            quantityChange > 0 && product.restockAlertCount > 0
              ? `Stock updated · ${product.restockAlertCount} customer${product.restockAlertCount === 1 ? "" : "s"} notified`
              : "Stock updated"
          );
          onClose();
        },
        onError: (err) => adminToast(err.response?.data?.message ?? "Could not update stock"),
      }
    );
  };

  return (
    <AdminModal
      title="Adjust stock"
      description={`${product.title} · ${product.stock} in stock, ${product.reservedStock} reserved, ${product.availableStock} available`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <AdminButton type="button" variant="ghost" onClick={onClose}>Cancel</AdminButton>
          <AdminButton type="submit" form="adjust-stock" disabled={adjust.isPending || invalid}>
            {adjust.isPending ? "Saving…" : "Save"}
          </AdminButton>
        </div>
      }
    >
      <form id="adjust-stock" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-ink">Type</span>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={adminSelectCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-ink">
            {type === "recount" ? "Exact count" : "Units"}
          </span>
          <Input type="number" min="0" className={adminInputCls} {...register("units")} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-ink">Reason</span>
          <Input className={adminInputCls} placeholder="New shipment, recount correction…" {...register("reason")} />
          <span className="text-[11.5px] text-faint">Kept in this product's stock history.</span>
        </label>

        <div
          className={cn(
            "rounded-[12px] border px-3.5 py-2.5 text-[12.5px] font-semibold",
            invalid ? "border-[#F0C9C5] bg-[#FDF6F5] text-danger" : "border-brand-soft-border bg-brand-tint text-brand-deep"
          )}
        >
          {units <= 0
            ? "Enter a quantity to preview the new stock level."
            : nextStock < 0
              ? "That would take stock below zero."
              : `After saving: ${nextStock} in stock`}
        </div>
      </form>
    </AdminModal>
  );
}
