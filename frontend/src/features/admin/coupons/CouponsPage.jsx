import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Pencil, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { couponFormSchema } from "./schemas/couponSchema";
import {
  useAdminCoupons,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from "./api/useAdminCoupons";

function formatDiscount(coupon) {
  return coupon.type === "percentage" ? `${coupon.value}%` : `৳${coupon.value}`;
}

function formatDate(dateString) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// <input type="date"> needs a plain yyyy-mm-dd string, and the empty-string
// sentinel keeps optional numeric fields controllable rather than undefined.
function toDateInputValue(dateString) {
  return dateString ? new Date(dateString).toISOString().slice(0, 10) : "";
}

export function CouponsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);

  const { data, isLoading } = useAdminCoupons({ limit: 100 });
  const createMutation = useCreateCouponMutation();
  const updateMutation = useUpdateCouponMutation();
  const deleteMutation = useDeleteCouponMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(couponFormSchema) });

  const coupons = data?.data ?? [];

  const openCreate = () => {
    setEditingCoupon(null);
    reset({ code: "", type: "percentage", value: "", minOrderValue: 0, maxDiscount: "", usageLimit: "", expiresAt: "" });
    setDialogOpen(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    reset({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue ?? 0,
      maxDiscount: coupon.maxDiscount ?? "",
      usageLimit: coupon.usageLimit ?? "",
      expiresAt: toDateInputValue(coupon.expiresAt),
    });
    setDialogOpen(true);
  };

  const onSubmit = (values) => {
    const payload = {
      ...(editingCoupon ? {} : { code: values.code.toUpperCase().trim() }),
      type: values.type,
      value: values.value,
      minOrderValue: values.minOrderValue || 0,
      maxDiscount: values.maxDiscount === "" ? null : values.maxDiscount,
      usageLimit: values.usageLimit === "" ? null : values.usageLimit,
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
    };

    const mutation = editingCoupon
      ? updateMutation.mutateAsync({ id: editingCoupon._id, payload })
      : createMutation.mutateAsync(payload);

    toast.promise(mutation, {
      loading: "Saving...",
      success: () => {
        setDialogOpen(false);
        return editingCoupon ? "Coupon updated" : "Coupon created";
      },
      error: (err) => err.response?.data?.message ?? "Something went wrong",
    });
  };

  const onToggleActive = (coupon) => {
    updateMutation.mutate({ id: coupon._id, payload: { isActive: !coupon.isActive } });
  };

  const onDelete = () => {
    toast.promise(deleteMutation.mutateAsync(deletingCoupon._id), {
      loading: "Deleting...",
      success: () => {
        setDeletingCoupon(null);
        return "Coupon deleted";
      },
      error: (err) => err.response?.data?.message ?? "Could not delete",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Coupons</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus /> Add Coupon
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Min. order</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && coupons.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No coupons yet.
              </TableCell>
            </TableRow>
          )}
          {coupons.map((coupon) => (
            <TableRow key={coupon._id}>
              <TableCell className="font-mono text-xs font-medium">{coupon.code}</TableCell>
              <TableCell>
                {formatDiscount(coupon)}
                {coupon.maxDiscount && <span className="text-muted-foreground"> (max ৳{coupon.maxDiscount})</span>}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {coupon.minOrderValue > 0 ? `৳${coupon.minOrderValue}` : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {coupon.usedCount}
                {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(coupon.expiresAt) ?? <Badge variant="outline">No expiry</Badge>}
              </TableCell>
              <TableCell>
                <Switch checked={coupon.isActive} onCheckedChange={() => onToggleActive(coupon)} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Edit coupon" onClick={() => openEdit(coupon)}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete coupon" onClick={() => setDeletingCoupon(coupon)}>
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.code}>
                <FieldLabel htmlFor="code">Code</FieldLabel>
                <Input id="code" {...register("code")} disabled={!!editingCoupon} className="uppercase" />
                {editingCoupon && <p className="text-xs text-muted-foreground">Code can't be changed after creation.</p>}
                <FieldError errors={errors.code ? [errors.code] : undefined} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
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
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed amount</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field data-invalid={!!errors.value}>
                  <FieldLabel htmlFor="value">Value</FieldLabel>
                  <Input id="value" type="number" step="any" {...register("value")} />
                  <FieldError errors={errors.value ? [errors.value] : undefined} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="minOrderValue">Min. order value</FieldLabel>
                  <Input id="minOrderValue" type="number" {...register("minOrderValue")} />
                </Field>
                <Field data-invalid={!!errors.maxDiscount}>
                  <FieldLabel htmlFor="maxDiscount">Max discount (৳)</FieldLabel>
                  <Input id="maxDiscount" type="number" placeholder="No cap" {...register("maxDiscount")} />
                  <FieldError errors={errors.maxDiscount ? [errors.maxDiscount] : undefined} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field data-invalid={!!errors.usageLimit}>
                  <FieldLabel htmlFor="usageLimit">Usage limit</FieldLabel>
                  <Input id="usageLimit" type="number" placeholder="Unlimited" {...register("usageLimit")} />
                  <FieldError errors={errors.usageLimit ? [errors.usageLimit] : undefined} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="expiresAt">Expires</FieldLabel>
                  <Input id="expiresAt" type="date" {...register("expiresAt")} />
                </Field>
              </div>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingCoupon ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCoupon} onOpenChange={(open) => !open && setDeletingCoupon(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingCoupon?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. Deletion is blocked if the coupon has already been used — deactivate it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
