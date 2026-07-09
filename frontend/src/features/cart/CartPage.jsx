import { Link } from "react-router";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";
import { useCart } from "./api/useCart";
import { CartLineItem } from "./components/CartLineItem";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

export function CartPage() {
  const { items, subtotal, itemCount, isLoading } = useCart();

  return (
    <Container className="py-10">
      <h1 className="mb-6 font-heading text-3xl text-foreground">Your Cart</h1>

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <ShoppingCart className="size-10 text-muted-foreground/40" strokeWidth={1.25} />
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild size="sm">
            <Link to={ROUTES.SHOP}>Browse the collection</Link>
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            {items.map((item) => (
              <CartLineItem key={item.product._id} item={item} />
            ))}
          </div>

          <div className="flex h-fit flex-col gap-4 rounded-xl border border-border p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
              <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Shipping and totals are calculated at checkout.</p>
            <Button asChild size="lg">
              <Link to={ROUTES.CHECKOUT}>Checkout</Link>
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
