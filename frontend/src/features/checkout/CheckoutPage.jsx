import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError, FieldGroup, FieldSeparator } from "@/components/ui/field";
import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";
import { useCart } from "@/features/cart/api/useCart";
import { useSettings } from "@/features/settings/api/useSettings";
import { useCurrentUser } from "@/features/auth/api/useAuth";
import { useCreateOrderMutation } from "@/features/orders/api/useOrders";
import { checkoutSchema } from "./schemas/checkoutSchema";
import { AddressSelector } from "./components/AddressSelector";
import { CouponInput } from "./components/CouponInput";
import { OrderSummary } from "./components/OrderSummary";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { items, subtotal, isLoading: cartLoading } = useCart();
  const { data: settings } = useSettings();
  const createOrderMutation = useCreateOrderMutation();

  const [addressId, setAddressId] = useState(null);
  const [coupon, setCoupon] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "cod" },
  });

  const hasStockIssue = items.some((item) => item.stockIssue);
  const freeShippingThreshold = settings?.freeShippingThreshold ?? 0;
  const shippingFee =
    freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : settings?.shippingFee ?? 0;

  if (!cartLoading && items.length === 0 && !createOrderMutation.isSuccess) {
    return <Navigate to={ROUTES.CART} replace />;
  }

  const onSubmit = (values) => {
    if (!addressId) {
      toast.error("Please select or add a shipping address");
      return;
    }

    createOrderMutation.mutate(
      { addressId, couponCode: coupon?.code, ...values },
      {
        onSuccess: (order) => navigate(`/orders/${order.orderNumber}`),
        onError: (err) => toast.error(err.response?.data?.message ?? "Could not place order"),
      }
    );
  };

  return (
    <Container className="py-10">
      <h1 className="mb-6 font-heading text-3xl text-foreground">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div>
            <h2 className="mb-3 font-heading text-lg text-foreground">Shipping Address</h2>
            <AddressSelector selectedId={addressId} onSelect={setAddressId} />
          </div>

          <FieldGroup>
            <FieldSeparator>Contact &amp; delivery</FieldSeparator>
            <Field data-invalid={!!errors.phone}>
              <FieldLabel htmlFor="phone">Phone for delivery</FieldLabel>
              <Input id="phone" type="tel" defaultValue={user?.phone ?? ""} {...register("phone")} />
              <FieldError errors={errors.phone ? [errors.phone] : undefined} />
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
