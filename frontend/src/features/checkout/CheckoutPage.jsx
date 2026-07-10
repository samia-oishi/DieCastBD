import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError, FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";
import { useCart } from "@/features/cart/api/useCart";
import { useSettings } from "@/features/settings/api/useSettings";
import { useCurrentUser } from "@/features/auth/api/useAuth";
import { useCreateOrderMutation } from "@/features/orders/api/useOrders";
import { AddressForm } from "@/features/addresses/components/AddressForm";
import { checkoutSchema } from "./schemas/checkoutSchema";
import { AddressSelector } from "./components/AddressSelector";
import { CouponInput } from "./components/CouponInput";
import { OrderSummary } from "./components/OrderSummary";

function GuestAddressSection({ address, onSave, email, onEmailChange }) {
  const [editing, setEditing] = useState(!address);

  if (!editing && address) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-lg border border-primary bg-primary/5 p-4 text-sm">
        <div>
          <p className="font-medium text-foreground">
            {address.recipientName} · {address.phone}
          </p>
          <p className="text-muted-foreground">
            {address.addressLine1}
            {address.addressLine2 && `, ${address.addressLine2}`}, {address.city}
            {address.district && `, ${address.district}`}
            {address.postalCode && ` ${address.postalCode}`}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AddressForm
        onSubmit={(values) => {
          onSave(values);
          setEditing(false);
        }}
        isSubmitting={false}
      />
      <Field>
        <FieldLabel htmlFor="guestEmail">Email (optional — for your order confirmation)</FieldLabel>
        <Input id="guestEmail" type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} />
      </Field>
    </div>
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { items, subtotal, isLoading: cartLoading } = useCart();
  const { data: settings } = useSettings();
  const createOrderMutation = useCreateOrderMutation();

  const [addressId, setAddressId] = useState(null);
  const [guestAddress, setGuestAddress] = useState(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [coupon, setCoupon] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "cod", shippingZone: "" },
  });

  const shippingZones = settings?.shippingZones ?? [];
  const selectedZone = watch("shippingZone");

  // Settings load asynchronously, after the form's initial defaultValues are
  // set — default to the first configured zone once zones arrive, but only if
  // the customer hasn't already picked one.
  useEffect(() => {
    if (!selectedZone && shippingZones.length > 0) {
      setValue("shippingZone", shippingZones[0].name);
    }
  }, [shippingZones, selectedZone, setValue]);

  const hasStockIssue = items.some((item) => item.stockIssue);
  const freeShippingThreshold = settings?.freeShippingThreshold ?? 0;
  const zoneFee = shippingZones.find((z) => z.name === selectedZone)?.fee ?? 0;
  const shippingFee = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : zoneFee;

  if (!cartLoading && items.length === 0 && !createOrderMutation.isSuccess) {
    return <Navigate to={ROUTES.CART} replace />;
  }

  const onSubmit = (values) => {
    if (user && !addressId) {
      toast.error("Please select or add a shipping address");
      return;
    }
    if (!user && !guestAddress) {
      toast.error("Please enter your shipping address");
      return;
    }

    // Guests (and, later, Buy Now) send cart items directly since there's no
    // server-side Cart to read for a guest — the backend branches on presence
    // of `items` to pick the items-array order path over the cart-based one.
    const payload = user
      ? { addressId, couponCode: coupon?.code, ...values }
      : {
          items: items.map((i) => ({ productId: i.product._id, qty: i.qty })),
          guestInfo: { name: guestAddress.recipientName, phone: guestAddress.phone, email: guestEmail || undefined },
          shippingAddress: guestAddress,
          couponCode: coupon?.code,
          ...values,
        };

    createOrderMutation.mutate(payload, {
      onSuccess: (order) => navigate(ROUTES.ORDER_CONFIRMATION, { state: { order } }),
      onError: (err) => toast.error(err.response?.data?.message ?? "Could not place order"),
    });
  };

  return (
    <Container className="py-10">
      <h1 className="mb-6 font-heading text-3xl text-foreground">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div>
            <h2 className="mb-3 font-heading text-lg text-foreground">Shipping Address</h2>
            {user ? (
              <AddressSelector selectedId={addressId} onSelect={setAddressId} />
            ) : (
              <GuestAddressSection
                address={guestAddress}
                onSave={setGuestAddress}
                email={guestEmail}
                onEmailChange={setGuestEmail}
              />
            )}
          </div>

          <FieldGroup>
            <FieldSeparator>Contact &amp; delivery</FieldSeparator>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone">Phone for delivery</FieldLabel>
              <Input id="phone" type="tel" defaultValue={user?.phone ?? ""} {...register("phone")} />
              <FieldError errors={errors.phone ? [errors.phone] : undefined} />
            </Field>
            <Field data-invalid={!!errors.shippingZone}>
              <FieldLabel htmlFor="shippingZone">Shipping zone</FieldLabel>
              <Controller
                control={control}
                name="shippingZone"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="shippingZone" className="w-full">
                      <SelectValue placeholder="Select a shipping zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingZones.map((zone) => (
                        <SelectItem key={zone.name} value={zone.name}>
                          {zone.name} — ৳{zone.fee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={errors.shippingZone ? [errors.shippingZone] : undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="deliveryNote">Delivery note (optional)</FieldLabel>
              <Textarea id="deliveryNote" rows={2} {...register("deliveryNote")} />
            </Field>
          </FieldGroup>

          <div>
            <h2 className="mb-3 font-heading text-lg text-foreground">Payment Method</h2>
            <Controller
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm has-checked:border-primary has-checked:bg-primary/5">
                    <input
                      type="radio"
                      checked={field.value === "cod"}
                      onChange={() => field.onChange("cod")}
                    />
                    Cash on Delivery
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm opacity-50">
                    <input type="radio" disabled />
                    bKash (coming soon)
                  </label>
                </div>
              )}
            />
          </div>
        </div>

        <div className="flex h-fit flex-col gap-4 rounded-xl border border-border p-6">
          <OrderSummary items={items} subtotal={subtotal} discount={coupon?.discount ?? 0} shippingFee={shippingFee} />
          <CouponInput
            subtotal={subtotal}
            appliedCoupon={coupon}
            onApply={setCoupon}
            onRemove={() => setCoupon(null)}
          />
          {hasStockIssue && (
            <p className="text-xs text-destructive">
              Some items in your cart have limited stock — adjust quantities before placing your order.
            </p>
          )}
          <Button type="submit" size="lg" disabled={createOrderMutation.isPending || hasStockIssue}>
            {createOrderMutation.isPending ? "Placing order..." : "Place Order"}
          </Button>
        </div>
      </form>
    </Container>
  );
}
