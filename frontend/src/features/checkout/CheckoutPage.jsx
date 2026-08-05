import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, Link, useLocation, useNavigate } from "react-router";
import { ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import { Seo } from "@/components/shared/Seo";
import { ROUTES } from "@/constants/routes";
import { formatTaka } from "@/lib/currency";
import { useCart } from "@/features/cart/api/useCart";
import { useSettings } from "@/features/settings/api/useSettings";
import { useCurrentUser } from "@/features/auth/api/useAuth";
import { useCreateOrderMutation } from "@/features/orders/api/useOrders";
import { useCartStore } from "@/stores/cartStore";
import { checkoutSchema } from "./schemas/checkoutSchema";
import { resolvePaymentOptionAvailability, calculateAmountPaidPreview } from "./lib/paymentPlanPreview";
import { deriveCheckoutView } from "./lib/checkoutCopy";
import { CheckoutSteps } from "./components/CheckoutSteps";
import { SectionCard, inputCls } from "./components/parts";
import { AddressSelector } from "./components/AddressSelector";
import { GuestAddressForm } from "./components/GuestAddressForm";
import { DeliveryOptions } from "./components/DeliveryOptions";
import { PaymentMethods } from "./components/PaymentMethods";
import { CheckoutSummary } from "./components/CheckoutSummary";
import { effectivePrice } from "@/lib/pricing";

function toBuyNowLineItem({ product, qty }) {
  const price = effectivePrice(product);
  return {
    product,
    qty,
    lineTotal: price * qty,
    stockIssue: qty > product.availableStock ? { availableStock: product.availableStock } : null,
  };
}

function couponDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  const raw = coupon.type === "percentage" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.min(raw, subtotal);
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const cart = useCart();
  const { data: settings } = useSettings();
  const createOrderMutation = useCreateOrderMutation();
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const clearCoupon = useCartStore((s) => s.clearCoupon);

  // Buy Now: single item via router state, never touches the cart.
  const buyNowItem = location.state?.buyNowItem;
  const isBuyNow = Boolean(buyNowItem);
  const items = isBuyNow ? [toBuyNowLineItem(buyNowItem)] : cart.items;
  const subtotal = isBuyNow ? items[0].lineTotal : cart.subtotal;
  const cartLoading = isBuyNow ? false : cart.isLoading;

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [guestData, setGuestData] = useState(null);
  // Mobile-only: the address list starts collapsed to the chosen address (a
  // "Change" pill reveals the rest). Purely presentational.
  const [addressExpanded, setAddressExpanded] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "cod", paymentOption: "cod", shippingZone: "", bkashTransactionId: "", banglaQrReference: "", deliveryNote: "" },
  });

  const shippingZones = settings?.shippingZones ?? [];
  const selectedZone = watch("shippingZone");
  const paymentMethodValue = watch("paymentMethod");
  const paymentOptionValue = watch("paymentOption");

  useEffect(() => {
    if (!selectedZone && shippingZones.length > 0) setValue("shippingZone", shippingZones[0].name);
  }, [shippingZones, selectedZone, setValue]);

  const hasStockIssue = items.some((item) => item.stockIssue);
  const freeThreshold = settings?.freeShippingThreshold ?? 0;
  const selectedZoneData = shippingZones.find((z) => z.name === selectedZone);
  const zoneFee = selectedZoneData?.fee ?? 0;
  const zoneRequiresPrepay = selectedZoneData?.requiresPrepay ?? false;
  const freeShipping = freeThreshold > 0 && subtotal >= freeThreshold;
  const shippingFee = freeShipping ? 0 : zoneFee;
  const discount = couponDiscount(coupon, subtotal);
  const total = Math.max(0, subtotal - discount) + shippingFee;
  const shipping = { name: selectedZone || (shippingZones[0]?.name ?? "Standard"), fee: zoneFee, free: freeShipping };

  // Per-product paymentOptions + the zone's requiresPrepay flag together decide
  // which order-level paymentOption(s) the whole cart can use — preview only,
  // the backend re-validates and computes the authoritative amounts.
  const paymentPlan = resolvePaymentOptionAvailability({ items, zoneRequiresPrepay });
  const nonCodOptions = ["deliveryOnly", "partialAdvance", "full"]
    .filter((key) => paymentPlan.availability[key])
    .map((key) => ({
      key,
      ...calculateAmountPaidPreview({
        subtotal,
        total,
        shippingFee,
        paymentOption: key,
        advancePaymentPercent: paymentPlan.advancePaymentPercent,
      }),
    }));
  const codDisabled = !paymentPlan.availability.cod;

  // Keep the form's paymentOption in sync with what's actually selectable:
  // COD payment method can only ever mean the "cod" business option; bKash/
  // BanglaQR must pick one of the available non-cod options (auto-picks the
  // first if the cart contents changed out from under a stale selection, or
  // steers the customer off a disabled COD choice automatically).
  useEffect(() => {
    if (paymentMethodValue === "cod") {
      if (codDisabled) {
        setValue("paymentMethod", "bkash");
      } else if (paymentOptionValue !== "cod") {
        setValue("paymentOption", "cod");
      }
    } else if (!nonCodOptions.some((o) => o.key === paymentOptionValue)) {
      setValue("paymentOption", nonCodOptions[0]?.key ?? "full");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethodValue, codDisabled, nonCodOptions.map((o) => o.key).join(","), paymentOptionValue]);

  // The redesign's view-model (rule / min / payNow / due + copy), derived purely
  // from the availability above — no money is invented here.
  const view = deriveCheckoutView({
    items,
    availability: paymentPlan.availability,
    nonCodOptions,
    total,
    paymentMethod: paymentMethodValue,
    paymentOption: paymentOptionValue,
  });

  if (!cartLoading && items.length === 0 && !createOrderMutation.isSuccess) {
    return <Navigate to={ROUTES.CART} replace />;
  }

  const onSubmit = (values) => {
    if (user && !selectedAddress) return toast.error("Please select or add a shipping address");
    if (!user && !guestData) return toast.error("Please complete your shipping address");
    if (hasStockIssue) return toast.error("Adjust the quantities that exceed available stock first");

    const phone = user ? selectedAddress.phone : guestData.phone;
    const itemsPayload = items.map((i) => ({ productId: i.product._id, qty: i.qty }));

    const payload = user
      ? { addressId: selectedAddress._id, phone, couponCode: coupon?.code, ...(isBuyNow ? { items: itemsPayload } : {}), ...values }
      : {
          items: itemsPayload,
          phone,
          guestInfo: { name: guestData.recipientName, phone: guestData.phone, email: guestData.email || undefined },
          shippingAddress: {
            recipientName: guestData.recipientName,
            phone: guestData.phone,
            addressLine1: guestData.addressLine1,
            city: guestData.city,
            district: guestData.district || undefined,
            postalCode: guestData.postalCode || undefined,
          },
          couponCode: coupon?.code,
          ...values,
        };

    createOrderMutation.mutate(payload, {
      onSuccess: (order) => { clearCoupon(); navigate(ROUTES.ORDER_CONFIRMATION, { state: { order } }); },
      onError: (err) => toast.error(err.response?.data?.message ?? "Could not place order"),
    });
  };

  const summaryProps = {
    items, subtotal, shipping, discount, total, coupon, view,
    onApplyCoupon: setCoupon, onRemoveCoupon: clearCoupon,
    isPending: createOrderMutation.isPending, disabled: hasStockIssue,
  };

  const addressCollapsed = Boolean(user && selectedAddress && !addressExpanded);

  return (
    <>
      <Seo title="Checkout" noindex />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto w-full max-w-[1160px] px-4 pb-24 pt-[18px] md:px-9 md:pb-11 md:pt-[30px]">
        {/* Mobile progress row — the desktop stepper lives in CheckoutHeader */}
        <CheckoutSteps className="justify-center text-[11.5px] md:hidden" />

        <h1 className="mt-3 font-display text-[22px] font-extrabold tracking-[-0.015em] text-ink md:mt-0 md:text-[30px]">Checkout</h1>
        <p className="mt-1 text-[13px] text-[#6B6E60] md:mt-1.5 md:text-[14.5px]">
          <span className="md:hidden">Address, delivery, then how you'd like to pay.</span>
          <span className="hidden md:inline">Address, delivery, then how you'd like to pay — two minutes, tops.</span>
        </p>

        <div className="mt-3.5 grid items-start gap-3 md:mt-6 md:grid-cols-[minmax(0,1fr)_372px] md:gap-[26px]">
          {/* LEFT — the three section cards */}
          <div className="flex min-w-0 flex-col gap-3 md:gap-[18px]">
            {!user && (
              <div className="flex items-center justify-between gap-3 rounded-[16px] border border-brand-soft-border bg-brand-soft px-4 py-3 md:rounded-[20px] md:px-[26px]">
                <div className="text-[13px] text-ink-soft md:text-[13.5px]">
                  <span className="font-bold text-ink">Have an account?</span> Sign in for saved addresses.
                </div>
                <Link to={`${ROUTES.LOGIN}?redirect=/checkout`} className="shrink-0 rounded-full bg-ink px-4 py-2 text-[12.5px] font-semibold text-white">
                  Sign in
                </Link>
              </div>
            )}

            <SectionCard
              n="1"
              title={<><span className="md:hidden">Deliver to</span><span className="hidden md:inline">Shipping address</span></>}
              aside={
                addressCollapsed && (
                  <button
                    type="button"
                    onClick={() => setAddressExpanded(true)}
                    className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors duration-150 hover:border-brand md:hidden"
                  >
                    Change
                  </button>
                )
              }
            >
              {user ? (
                <AddressSelector
                  selectedId={selectedAddress?._id}
                  onSelect={(address) => { setSelectedAddress(address); setAddressExpanded(false); }}
                  collapsed={addressCollapsed}
                />
              ) : (
                <GuestAddressForm onChange={setGuestData} />
              )}
            </SectionCard>

            <SectionCard
              n="2"
              title="Delivery"
              aside={<span className="hidden text-[12.5px] text-faint md:inline">Tracked door-to-door, nationwide</span>}
            >
              <DeliveryOptions zones={shippingZones} value={selectedZone} onChange={(z) => setValue("shippingZone", z)} />
              <textarea
                {...register("deliveryNote")}
                rows={2}
                placeholder="Anything for the rider? Landmark, preferred time…"
                className={`${inputCls} mt-3 resize-y`}
              />
            </SectionCard>

            <SectionCard
              n="3"
              title="Payment"
              aside={
                <span className="hidden items-center gap-1.5 text-[12.5px] text-faint md:inline-flex">
                  <ShieldCheck size={13} strokeWidth={2} className="text-brand-deep" />
                  Payments matched instantly
                </span>
              }
            >
              <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <PaymentMethods
                    value={field.value}
                    onChange={field.onChange}
                    view={view}
                    bkashConfig={settings?.bkashConfig}
                    banglaQrConfig={settings?.banglaQrConfig}
                    register={register}
                    errors={errors}
                    paymentOption={paymentOptionValue}
                    onPaymentOptionChange={(key) => setValue("paymentOption", key)}
                  />
                )}
              />
            </SectionCard>

            {/* Mobile: summary sits after payment, per the design's order */}
            <div className="md:hidden">
              <CheckoutSummary variant="mobile" {...summaryProps} />
            </div>
          </div>

          {/* RIGHT — sticky summary (desktop). The `sticky` MUST live on the grid
              item itself, not on the card inside it: the grid is `items-start`, so a
              wrapper would collapse to the card's exact height and leave the sticky
              child nowhere to travel. Same pattern as the Shop sidebar and Cart
              summary, and the same top-[98px] offset (clears the sticky header). */}
          <div className="hidden md:sticky md:top-[98px] md:block">
            <CheckoutSummary variant="desktop" {...summaryProps} />
          </div>
        </div>

        {/* Mobile pay bar — same dark-glass floating shell the PDP's StickyBuyBar
            uses, so the app's bottom bars stay consistent. */}
        <div className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-2 rounded-[22px] border border-white/16 bg-[rgba(13,15,7,0.92)] p-[10px] pl-4 shadow-[0_10px_30px_rgba(16,18,8,0.45)] [backdrop-filter:blur(22px)_saturate(160%)] [-webkit-backdrop-filter:blur(22px)_saturate(160%)] md:hidden">
          {/* On COD payNow is ৳0, which is a pointless thing to headline — show
              what's actually owed instead, and only call it a "split" when it is one. */}
          <div className="min-w-0">
            <div className="font-display text-[17px] font-extrabold leading-tight text-white">
              {formatTaka(view.payNow > 0 ? view.payNow : total)}
            </div>
            <div className="whitespace-nowrap text-[11px] text-[#A9AC9F]">
              {view.payNow > 0 ? `pay now · ${formatTaka(total)} total` : "due on delivery"}
            </div>
          </div>
          <button
            type="submit"
            disabled={createOrderMutation.isPending || hasStockIssue}
            className="flex h-[46px] flex-1 items-center justify-center rounded-full bg-brand text-[13px] font-extrabold text-ink disabled:opacity-60"
          >
            {createOrderMutation.isPending ? "Placing…" : "Place order"}
          </button>
        </div>
      </form>
    </>
  );
}
