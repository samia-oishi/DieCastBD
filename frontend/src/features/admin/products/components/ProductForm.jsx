import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useBrands } from "@/features/admin/catalog/api/useBrands";
import { useCategories } from "@/features/admin/catalog/api/useCategories";
import { SectionPanel } from "@/features/admin/shell/SectionPanel";
import { adminInputCls, adminTextareaCls } from "@/features/admin/shell/adminFieldCls";
import { effectivePrice } from "@/lib/pricing";
import { ProductPhotos } from "./ProductPhotos";
import { SaveBar } from "@/features/admin/shell/SaveBar";
import { adminToast } from "@/features/admin/shell/adminToast";
import { listAdminProducts } from "../api/productApi";
import { productSchema } from "../schemas/productSchema";
import { ROUTES } from "@/constants/routes";

const emptyToUndefined = (value) => (value === "" ? undefined : value);
const toDateInputValue = (dateString) => (dateString ? new Date(dateString).toISOString().slice(0, 10) : "");

const PAYMENT_OPTIONS = [
  { key: "cod", label: "Cash on Delivery" },
  { key: "deliveryOnly", label: "Delivery Charge Only" },
  { key: "partialAdvance", label: "Partial Advance Payment" },
  { key: "full", label: "Full Payment" },
];

const MERCH_TOGGLES = [
  { name: "isFeatured", label: "Featured", hint: "Shows in the homepage Featured row" },
  { name: "isHeroProduct", label: "Hero product", hint: "Eligible for the hero highlight card" },
  { name: "isNewArrival", label: "New arrival", hint: "Badged and listed under New Arrivals" },
];

// EVERY registered field must appear here. RHF derives `isDirty` by comparing
// current values against defaultValues, so a registered-but-undefined field makes
// the form dirty on mount (isDirty true with an empty dirtyFields) — which showed
// the "Unsaved changes" bar on a brand-new blank form.
const BLANK = {
  sku: "",
  title: "",
  brand: "",
  category: [],
  status: "draft",
  description: "",
  series: "",
  modelNumber: "",
  manufacturer: "",
  scale: "",
  material: "",
  color: "",
  price: 0,
  salePrice: "",
  costPrice: "",
  stock: 0,
  isFeatured: false,
  isHeroProduct: false,
  isNewArrival: false,
  isPreOrder: false,
  preOrderStartDate: "",
  preOrderEndDate: "",
  paymentOptions: ["cod", "full"],
  advancePaymentPercent: "",
};

/** Server product → form values. Nulls become "" so inputs stay controlled and
 * an optional field the product doesn't have can't read as an edit. */
function toFormValues(product) {
  if (!product) return BLANK;
  const mapped = {
    ...product,
    brand: product.brand?._id ?? product.brand ?? "",
    category: product.category?.map((c) => c._id ?? c) ?? [],
    salePrice: product.salePrice ?? "",
    costPrice: product.costPrice ?? "",
    preOrderStartDate: toDateInputValue(product.preOrderStartDate),
    preOrderEndDate: toDateInputValue(product.preOrderEndDate),
    paymentOptions: product.paymentOptions?.length ? product.paymentOptions : ["cod", "full"],
    advancePaymentPercent: product.advancePaymentPercent ?? "",
  };
  const values = { ...BLANK };
  for (const key of Object.keys(BLANK)) {
    if (mapped[key] !== undefined && mapped[key] !== null) values[key] = mapped[key];
  }
  return values;
}

/** Field label + optional error, matching the design's 12.5px semibold labels. */
function L({ label, error, children, className }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[12.5px] font-semibold text-ink">{label}</span>
      {children}
      {error && <span className="text-[11.5px] text-danger">{error.message}</span>}
    </label>
  );
}

function ToggleRow({ label, hint, checked, onChange, disabled }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink">{label}</div>
        {hint && <div className="text-[11.5px] text-faint">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="mt-0.5 shrink-0" />
    </div>
  );
}

export function ProductForm({ product, onSubmit, isSubmitting }) {
  const navigate = useNavigate();
  const brands = useBrands();
  const categories = useCategories();
  const [skuBusy, setSkuBusy] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: toFormValues(product),
  });

  const paymentOptions = watch("paymentOptions");
  const hasPartialAdvance = paymentOptions?.includes("partialAdvance");
  const isPreOrder = watch("isPreOrder");

  // Live profit/margin — same shared rule as everywhere else (lib/pricing), so a
  // stray sale price of 0 can't show a ৳0 product here either.
  const price = Number(watch("price")) || 0;
  const salePrice = Number(watch("salePrice")) || 0;
  const costPrice = Number(watch("costPrice")) || 0;
  const effective = effectivePrice({ price, salePrice });
  const profit = effective - costPrice;
  const margin = effective > 0 ? Math.round((profit / effective) * 100) : 0;

  /** Suggest the next SKU: brand initials + the next free number for that prefix.
   * Uses the real product list (search now filters on SKU), so it won't collide
   * with an existing code. Always editable afterwards. */
  const autoSku = async () => {
    const brandId = getValues("brand");
    const brandName = brands.list.data?.find((b) => b._id === brandId)?.name;
    if (!brandName) {
      adminToast("Pick a brand first — the SKU prefix comes from it");
      return;
    }
    const prefix = brandName
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 4);

    setSkuBusy(true);
    try {
      const res = await listAdminProducts({ q: prefix, limit: 100 });
      const used = (res?.data ?? [])
        .map((p) => new RegExp(`^${prefix}-(\\d+)$`, "i").exec(p.sku ?? "")?.[1])
        .filter(Boolean)
        .map(Number);
      const next = used.length ? Math.max(...used) + 1 : 1;
      setValue("sku", `${prefix}-${String(next).padStart(3, "0")}`, { shouldDirty: true, shouldValidate: true });
    } catch {
      adminToast("Could not check existing SKUs — enter one manually");
    } finally {
      setSkuBusy(false);
    }
  };

  const submit = (values) => {
    const payload = {
      ...values,
      salePrice: emptyToUndefined(values.salePrice),
      costPrice: emptyToUndefined(values.costPrice),
      preOrderStartDate: values.preOrderStartDate ? new Date(values.preOrderStartDate).toISOString() : null,
      preOrderEndDate: values.preOrderEndDate ? new Date(values.preOrderEndDate).toISOString() : null,
      advancePaymentPercent: values.paymentOptions?.includes("partialAdvance")
        ? emptyToUndefined(values.advancePaymentPercent)
        : null,
    };
    onSubmit(payload, {
      onSuccess: (saved) => {
        adminToast(product ? "Product saved" : "Product created");
        if (product) reset(values); // clears the dirty state, keeps the edits
        else navigate(`${ROUTES.ADMIN}/products/${saved?._id ?? ""}`.replace(/\/$/, ""));
      },
      onError: (err) => adminToast(err.response?.data?.message ?? "Something went wrong"),
    });
  };

  // Surface validation failures as a toast — the design's rule is that a failed
  // save never fails silently.
  const onInvalid = (errs) => {
    const first = Object.values(errs)[0];
    adminToast(first?.message ?? "Check the highlighted fields");
  };

  return (
    <form onSubmit={handleSubmit(submit, onInvalid)} noValidate className="flex flex-col gap-[18px] pb-24">
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {/* LEFT */}
        <div className="flex flex-col gap-[18px]">
          <SectionPanel title="Basics" bodyClassName="pt-3">
            <div className="flex flex-col gap-3">
              <L label="Title" error={errors.title}>
                <Input className={adminInputCls} {...register("title")} placeholder="e.g. MINI GT #1106 Mazda RX-7 RE Amemiya — Silver" />
              </L>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <L label="SKU" error={errors.sku}>
                  <div className="flex gap-2">
                    <Input className={cn(adminInputCls, "min-w-0")} {...register("sku")} placeholder="MGT-0000" />
                    <button
                      type="button"
                      onClick={autoSku}
                      disabled={skuBusy}
                      title="Generate from brand"
                      className="h-11 shrink-0 rounded-[12px] border border-line bg-white px-3.5 text-[12px] font-bold text-ink-soft transition-colors hover:border-ink disabled:opacity-50"
                    >
                      {skuBusy ? "…" : "Auto"}
                    </button>
                  </div>
                </L>
                <L label="Status">
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={adminInputCls}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </L>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <L label="Brand" error={errors.brand}>
                  <Controller
                    control={control}
                    name="brand"
                    render={({ field }) => (
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <SelectTrigger className={adminInputCls}><SelectValue placeholder="Select brand" /></SelectTrigger>
                        <SelectContent>
                          {brands.list.data?.map((b) => (
                            <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </L>
                <L label="Category">
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select
                        value={field.value?.[0] || undefined}
                        onValueChange={(v) => field.onChange(v ? [v] : [])}
                      >
                        <SelectTrigger className={adminInputCls}><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {categories.list.data?.map((c) => (
                            <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </L>
              </div>

              <L label="Description">
                <Textarea rows={4} className={adminTextareaCls} {...register("description")} placeholder="What makes this piece worth collecting?" />
              </L>
            </div>
          </SectionPanel>

          <ProductPhotos product={product} />

          <SectionPanel title="Collector details" bodyClassName="pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <L label="Series"><Input className={adminInputCls} {...register("series")} /></L>
              <L label="Model number"><Input className={adminInputCls} {...register("modelNumber")} /></L>
              <L label="Manufacturer"><Input className={adminInputCls} {...register("manufacturer")} placeholder="TSM / Mattel" /></L>
              <L label="Scale"><Input className={adminInputCls} {...register("scale")} placeholder="1:64" /></L>
              <L label="Material"><Input className={adminInputCls} {...register("material")} placeholder="Diecast metal" /></L>
              <L label="Color"><Input className={adminInputCls} {...register("color")} placeholder="Silver" /></L>
            </div>
          </SectionPanel>
        </div>

        {/* RIGHT RAIL */}
        <div className="flex flex-col gap-[18px]">
          <SectionPanel title="Pricing & stock" bodyClassName="pt-3">
            <div className="grid grid-cols-2 gap-3">
              <L label="Price (৳)" error={errors.price}>
                <Input type="number" step="1" className={adminInputCls} {...register("price")} />
              </L>
              <L label="Sale price (৳)" error={errors.salePrice}>
                <Input type="number" step="1" className={adminInputCls} placeholder="Optional" {...register("salePrice")} />
              </L>
              <L label="Cost price (৳)" error={errors.costPrice}>
                <Input type="number" step="1" className={adminInputCls} {...register("costPrice")} />
              </L>
              <L label="Stock" error={errors.stock}>
                <Input type="number" className={adminInputCls} {...register("stock")} />
              </L>
            </div>

            {/* Profit box — always on, updates as you type (prototype). Value is
                ink, red when negative. */}
            <div className="mt-3.5 rounded-[12px] border border-brand-soft-border bg-brand-tint px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-brand-deep">Profit per unit</div>
                  <div className={cn("mt-0.5 font-display text-[18px] font-extrabold", profit < 0 ? "text-danger" : "text-ink")}>
                    {formatTaka(profit)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-brand-deep">Margin</div>
                  <div className={cn("mt-0.5 font-display text-[18px] font-extrabold", profit < 0 ? "text-danger" : "text-ink")}>
                    {effective > 0 ? `${margin}%` : "—"}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11.5px] leading-[1.5] text-faint">
                Calculated from {effective < price && effective > 0 ? "the sale price" : "the price"} minus cost — updates as you type.
              </p>
            </div>
          </SectionPanel>

          <SectionPanel title="Merchandising" bodyClassName="pt-1">
            <div className="divide-y divide-line-soft">
              {MERCH_TOGGLES.map(({ name, label, hint }) => (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <ToggleRow label={label} hint={hint} checked={!!field.value} onChange={field.onChange} />
                  )}
                />
              ))}
            </div>
          </SectionPanel>

          <SectionPanel title="Pre-order" bodyClassName="pt-1">
            <Controller
              control={control}
              name="isPreOrder"
              render={({ field }) => (
                <ToggleRow
                  label="Sell before the batch lands"
                  checked={!!field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {isPreOrder && (
              <div className="mt-2 grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
                <L label="Start date"><Input type="date" className={adminInputCls} {...register("preOrderStartDate")} /></L>
                <L label="End date (optional)" error={errors.preOrderEndDate}>
                  <Input type="date" className={adminInputCls} {...register("preOrderEndDate")} />
                </L>
              </div>
            )}
          </SectionPanel>

          <SectionPanel title="Payment options" description="Which checkout methods this product allows." bodyClassName="pt-1">
            <Controller
              control={control}
              name="paymentOptions"
              render={({ field }) => {
                const selected = field.value ?? [];
                const toggle = (key) =>
                  field.onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
                return (
                  <div className="divide-y divide-line-soft">
                    {PAYMENT_OPTIONS.map(({ key, label, hint }) => (
                      <ToggleRow
                        key={key}
                        label={label}
                        hint={hint}
                        checked={selected.includes(key)}
                        // COD and partial advance are mutually exclusive (backend rule).
                        disabled={key === "cod" && selected.includes("partialAdvance")}
                        onChange={() => toggle(key)}
                      />
                    ))}
                  </div>
                );
              }}
            />
            {errors.paymentOptions && (
              <p className="mt-2 text-[11.5px] text-danger">{errors.paymentOptions.message}</p>
            )}
            {hasPartialAdvance && (
              <div className="mt-3 border-t border-line-soft pt-3">
                <L label="Advance payment percent (%)" error={errors.advancePaymentPercent}>
                  <Input type="number" min="1" max="100" className={adminInputCls} {...register("advancePaymentPercent")} />
                </L>
              </div>
            )}
          </SectionPanel>
        </div>
      </div>

      <SaveBar
        dirty={isDirty}
        saving={isSubmitting}
        onDiscard={() => reset()}
        saveLabel={product ? "Save product" : "Create product"}
      />
    </form>
  );
}
