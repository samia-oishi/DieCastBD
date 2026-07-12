import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, Link, useLocation, useNavigate } from "react-router";
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
import { CheckoutSteps } from "./components/CheckoutSteps";
import { NumberedCard, FieldBox, inputCls } from "./components/parts";
import { AddressSelector } from "./components/AddressSelector";
import { GuestAddressForm } from "./components/GuestAddressForm";
import { DeliveryOptions } from "./components/DeliveryOptions";
import { PaymentMethods } from "./components/PaymentMethods";
import { CheckoutSummary } from "./components/CheckoutSummary";

function toBuyNowLineItem({ product, qty }) {
  const price = product.salePrice ?? product.price;
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
    items, subtotal, shipping, discount, total, coupon,
    onApplyCoupon: setCoupon, onRemoveCoupon: clearCoupon,
    isPending: createOrderMutation.isPending, disabled: hasStockIssue,
  };

  return (
    <>
      <Seo title="Checkout" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto w-full max-w-[1160px] px-4 pb-28 pt-5 md:px-10 md:pb-10 md:pt-10">
        {/* Mobile progress row — the desktop stepper lives in CheckoutHeader */}
        <CheckoutSteps className="justify-center text-[11.5px] md:hidden" />
        {/* Title — desktop only; on mobile it sits in the app bar */}
        <h1 className="hidden font-display text-[34px] font-extrabold tracking-[-0.02em] text-ink md:block">Checkout</h1>
        <p className="mt-2 hidden text-[14.5px] text-muted-foreground md:block">Almost there — delivery details, then pick how you pay.</p>

        {/* Mobile: order summary on top */}
        <div className="mt-5 md:hidden">
          <CheckoutSummary variant="mobile" {...summaryProps} />
        </div>

        <div className="mt-5 grid items-start gap-8 md:mt-7 md:grid-cols-[1.55fr_1fr]">
          <div className="flex flex-col gap-[18px]">
            {!user && (
              <div className="flex items-center justify-between gap-4 rounded-[16px] border border-brand-soft-border bg-brand-soft px-[18px] py-3.5">
                <div className="text-[13.5px] text-ink-soft"><span className="font-bold text-ink">Have an account?</span> Sign in for saved addresses and order history.</div>
                <Link to={`${ROUTES.LOGIN}?redirect=/checkout`} className="shrink-0 rounded-full bg-ink px-[18px] py-2.5 text-[13px] font-semibold text-white">Sign in</Link>
              </div>
            )}

            <NumberedCard n="1" title="Shipping address">
              {user ? (
                <AddressSelector
                  selectedId={selectedAddress?._id}
                  onSelect={(address) => setSelectedAddress(address)}
                />
              ) : (
                <GuestAddressForm onChange={setGuestData} />
              )}
            </NumberedCard>

            <NumberedCard n="2" title="Delivery">
              <DeliveryOptions zones={shippingZones} value={selectedZone} onChange={(z) => setValue("shippingZone", z)} />
              <FieldBox label="Delivery note" hint="(optional)" className="mt-4">
                <textarea {...register("deliveryNote")} rows={2} placeholder="Landmark, preferred time…" className={inputCls} />
              </FieldBox>
            </NumberedCard>

            <NumberedCard n="3" title="Payment">
              <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <PaymentMethods
                    value={field.value}
                    onChange={field.onChange}
                    bkashConfig={settings?.bkashConfig}
                    banglaQrConfig={settings?.banglaQrConfig}
                    register={register}
                    errors={errors}
                    total={total}
                    codDisabled={codDisabled}
                    codDisabledReason={paymentPlan.codDisabledReason}
                    zoneRequiresPrepay={paymentPlan.zoneForcesPrepay}
                    shippingFee={shippingFee}
                    paymentOption={paymentOptionValue}
                    onPaymentOptionChange={(key) => setValue("paymentOption", key)}
                    nonCodOptions={nonCodOptions}
                  />
                )}
              />
            </NumberedCard>
          </div>

          {/* Desktop summary */}
          <div className="hidden md:block">
            <CheckoutSummary variant="desktop" {...summaryProps} />
          </div>
        </div>

        {/* Mobile sticky place-order bar */}
        <div className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-[22px] border border-white/16 bg-[rgba(13,15,7,0.92)] py-[10px] pl-5 pr-3 shadow-[0_10px_30px_rgba(16,18,8,0.45)] [backdrop-filter:blur(22px)_saturate(160%)] [-webkit-backdrop-filter:blur(22px)_saturate(160%)] md:hidden">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.06em] text-faint">TOTAL</div>
            <div className="font-display text-[18px] font-extrabold text-white">{formatTaka(total)}</div>
          </div>
          <button type="submit" disabled={createOrderMutation.isPending || hasStockIssue} className="flex h-12 flex-1 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-ink disabled:opacity-60">
            {createOrderMutation.isPending ? "Placing…" : "Place order"}
          </button>
        </div>
      </form>
    </>
  );
}
