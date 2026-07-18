import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Copy, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { AdminModal } from "@/features/admin/shell/AdminModal";
import { adminToast } from "@/features/admin/shell/adminToast";
import { adminInputCls, adminSelectCls } from "@/features/admin/shell/adminFieldCls";
import { couponFormSchema } from "./schemas/couponSchema";
import {
  useAdminCoupons,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from "./api/useAdminCoupons";

const GRID = "md:grid-cols-[minmax(130px,1fr)_minmax(150px,1fr)_100px_70px_110px_76px_110px]";

const toDateInputValue = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "10% (max ৳500)" / "৳500 off" — shared by the row and the live preview. */
function describeDiscount({ type, value, maxDiscount }) {
  const v = Number(value) || 0;
  if (type === "percentage") return `${v}%${maxDiscount ? ` (max ${formatTaka(maxDiscount)})` : ""}`;
  return `${formatTaka(v)} off`;
}

/** Plain-English summary of what the coupon actually does, updated as you type. */
function describeCoupon({ code, type, value, minOrderValue, maxDiscount, usageLimit, expiresAt }) {
  return (
    `${code?.toUpperCase() || "CODE"} gives ${describeDiscount({ type, value, maxDiscount })}` +
    (Number(minOrderValue) ? ` on orders over ${formatTaka(minOrderValue)}` : " on any order") +
    (usageLimit ? `, limited to ${usageLimit} uses` : "") +
    (expiresAt ? `, until ${formatDate(expiresAt)}` : "") +
    "."
  );
}

function CopyCode({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
        } catch {
          /* clipboard blocked — the code is still readable on screen */
        }
        setCopied(true);
        adminToast(`${code} copied`);
        setTimeout(() => setCopied(false), 1600);
      }}
      aria-label={`Copy ${code}`}
      title="Copy code"
      className="flex size-[26px] shrink-0 items-center justify-center rounded-[8px] border border-line bg-white text-faint transition-colors hover:border-ink hover:text-ink"
    >
      {copied ? <Check size={12} strokeWidth={2.6} className="text-brand-deep" /> : <Copy size={12} strokeWidth={2} />}
    </button>
  );
}

function IconAction({ label, icon: Icon, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-[30px] items-center justify-center rounded-[9px] border border-line bg-white text-[#6B6E60] transition-colors",
        danger ? "hover:border-[#F0C9C5] hover:bg-[#FDF6F5] hover:text-danger" : "hover:border-ink hover:text-ink"
      )}
    >
      <Icon size={14} strokeWidth={2} />
    </button>
  );
}

export function CouponsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);

  // The coupons endpoint returns the full { success, data } envelope.
  const { data: couponsResponse, isLoading } = useAdminCoupons();
  const createMutation = useCreateCouponMutation();
  const updateMutation = useUpdateCouponMutation();
  const deleteMutation = useDeleteCouponMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(couponFormSchema),
    defaultValues: { code: "", type: "percentage", value: "", minOrderValue: 0, maxDiscount: "", usageLimit: "", expiresAt: "" },
  });

  const live = watch();
  const isPercentage = live.type === "percentage";

  const openCreate = () => {
    setEditingCoupon(null);
    reset({ code: "", type: "percentage", value: "", minOrderValue: 0, maxDiscount: "", usageLimit: "", expiresAt: "" });
    setModalOpen(true);
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
    setModalOpen(true);
  };

  const onSubmit = (values) => {
    const payload = {
      // Code is immutable after creation (it's what customers have already been given).
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

    mutation
      .then(() => {
        adminToast(editingCoupon ? "Coupon saved" : "Coupon created");
        setModalOpen(false);
      })
      .catch((err) => adminToast(err.response?.data?.message ?? "Could not save coupon"));
  };

  const onToggleActive = (coupon) => {
    updateMutation.mutate(
      { id: coupon._id, payload: { isActive: !coupon.isActive } },
      { onError: (err) => adminToast(err.response?.data?.message ?? "Could not update coupon") }
    );
  };

  const onDelete = () => {
    deleteMutation
      .mutateAsync(deletingCoupon._id)
      .then(() => {
        adminToast("Coupon deleted");
        setDeletingCoupon(null);
      })
      .catch((err) => adminToast(err.response?.data?.message ?? "Could not delete coupon"));
  };

  const list = couponsResponse?.data ?? [];
  const liveCount = list.filter((c) => c.isActive).length;

  return (
    <div className="flex flex-col gap-[18px]">
      <AdminPageHeader
        eyebrow={`${list.length} coupon${list.length === 1 ? "" : "s"} · ${liveCount} live`}
        title="Coupons"
        actions={
          <AdminButton onClick={openCreate}>
            <Plus size={16} strokeWidth={2.4} /> Add coupon
          </AdminButton>
        }
      />

      <section className="overflow-x-auto rounded-[18px] border border-line bg-white">
        <div className="min-w-[820px]">
          <div className={cn("hidden items-center gap-2.5 border-b border-line-soft px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-faint md:grid", GRID)}>
            <span>Code</span>
            <span>Discount</span>
            <span className="text-right">Min. order</span>
            <span className="text-right">Used</span>
            <span>Expires</span>
            <span>Active</span>
            <span className="text-right">Actions</span>
          </div>

          {isLoading && <p className="px-5 py-10 text-center text-[13.5px] text-faint">Loading…</p>}
          {!isLoading && list.length === 0 && (
            <p className="px-5 py-10 text-center text-[13.5px] text-faint">No coupons yet — create your first one.</p>
          )}

          {list.map((c) => (
            <div
              key={c._id}
              className={cn(
                "grid grid-cols-1 items-center gap-2.5 border-b border-line-soft px-4 py-3 last:border-b-0 md:px-5 md:py-2.5",
                GRID
              )}
            >
              <span className="flex items-center gap-2">
                <span className="truncate rounded-[7px] bg-tile px-2 py-1 font-display text-[12px] font-extrabold tracking-[0.02em] text-ink">
                  {c.code}
                </span>
                <CopyCode code={c.code} />
              </span>

              {/* desktop cells */}
              <div className="hidden md:contents">
                <span className="truncate text-[12.5px] text-ink">{describeDiscount(c)}</span>
                <span className="text-right text-[12.5px] text-ink-soft">
                  {c.minOrderValue ? formatTaka(c.minOrderValue) : "—"}
                </span>
                <span className="text-right text-[12.5px] font-semibold text-ink">
                  {c.usedCount}
                  {c.usageLimit ? <span className="text-faint"> / {c.usageLimit}</span> : null}
                </span>
                <span>
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-[3px] text-[10.5px] font-bold",
                      c.expiresAt ? "bg-[#FDF3E7] text-warn" : "bg-tile text-ink-soft"
                    )}
                  >
                    {c.expiresAt ? formatDate(c.expiresAt) : "No expiry"}
                  </span>
                </span>
                <span>
                  <Switch checked={c.isActive} onCheckedChange={() => onToggleActive(c)} aria-label={`${c.code} active`} />
                </span>
                <span className="flex justify-end gap-1.5">
                  <IconAction label={`Edit ${c.code}`} icon={Pencil} onClick={() => openEdit(c)} />
                  <IconAction label={`Delete ${c.code}`} icon={Trash2} danger onClick={() => setDeletingCoupon(c)} />
                </span>
              </div>

              {/* mobile row */}
              <div className="flex items-center justify-between gap-3 md:hidden">
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] text-ink">{describeDiscount(c)}</div>
                  <div className="truncate text-[11.5px] text-faint">
                    used {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""} · {c.expiresAt ? formatDate(c.expiresAt) : "No expiry"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch checked={c.isActive} onCheckedChange={() => onToggleActive(c)} aria-label={`${c.code} active`} />
                  <IconAction label={`Edit ${c.code}`} icon={Pencil} onClick={() => openEdit(c)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[12px] leading-[1.6] text-faint">
        Tip: percentage coupons should carry a max-discount cap so a 10% code can&apos;t take ৳2,000 off a big cart.
      </p>

      {modalOpen && (
        <AdminModal
          title={editingCoupon ? "Edit coupon" : "Add coupon"}
          onClose={() => setModalOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <AdminButton type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</AdminButton>
              <AdminButton type="submit" form="coupon-form" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving…" : editingCoupon ? "Save coupon" : "Create coupon"}
              </AdminButton>
            </div>
          }
        >
          <form id="coupon-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold text-ink">Code</span>
              <Input
                className={cn(adminInputCls, "uppercase", editingCoupon && "bg-[#FCFCF9] text-faint")}
                {...register("code")}
                readOnly={!!editingCoupon}
                placeholder="SAVE500"
              />
              {errors.code && <span className="text-[11.5px] text-danger">{errors.code.message}</span>}
              {editingCoupon && (
                <span className="text-[11.5px] text-faint">Codes can&apos;t change — customers may already have this one.</span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Type</span>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={adminSelectCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">{isPercentage ? "Value (%)" : "Value (৳)"}</span>
                <Input type="number" className={adminInputCls} {...register("value")} />
                {errors.value && <span className="text-[11.5px] text-danger">{errors.value.message}</span>}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Min. order (৳)</span>
                <Input type="number" className={adminInputCls} {...register("minOrderValue")} />
              </label>
              {/* A cap only means anything for percentage discounts. */}
              {isPercentage && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12.5px] font-semibold text-ink">Max discount (৳)</span>
                  <Input type="number" className={adminInputCls} {...register("maxDiscount")} placeholder="No cap" />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Usage limit</span>
                <Input type="number" className={adminInputCls} {...register("usageLimit")} placeholder="Unlimited" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Expires</span>
                <Input type="date" className={adminInputCls} {...register("expiresAt")} />
              </label>
            </div>

            <div className="rounded-[12px] border border-brand-soft-border bg-brand-tint px-3.5 py-3 text-[12.5px] leading-[1.5] text-ink-soft">
              <strong className="text-brand-deep">Preview:</strong> {describeCoupon(live)}
            </div>
          </form>
        </AdminModal>
      )}

      <AlertDialog open={!!deletingCoupon} onOpenChange={(v) => !v && setDeletingCoupon(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingCoupon?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCoupon?.usedCount > 0
                ? `It's been used ${deletingCoupon.usedCount} time${deletingCoupon.usedCount === 1 ? "" : "s"}. Past orders keep their discount; the code just stops working.`
                : "The code will stop working immediately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
