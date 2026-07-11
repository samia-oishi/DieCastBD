import { Link } from "react-router";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { ROUTES } from "@/constants/routes";
import { useCart } from "../api/useCart";
import { CartLineItem } from "./CartLineItem";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

// Fully controlled (open/onOpenChange) — no internal trigger. SiteHeader owns
// its own pill-styled cart icon buttons (desktop + mobile app bar) and drives
// this sheet directly, since the trigger's visual design differs by breakpoint.
export function CartDrawer({ open, onOpenChange }) {
  const { items, subtotal, itemCount } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col overflow-y-auto p-6">
        <SheetHeader className="px-0">
          <SheetTitle>Your Cart {itemCount > 0 && `(${itemCount})`}</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingCart className="size-10 text-muted-foreground/40" strokeWidth={1.25} />
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Button asChild size="sm" onClick={() => onOpenChange(false)}>
              <Link to={ROUTES.SHOP}>Browse the collection</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-2">
              {items.map((item) => (
                <CartLineItem key={item.product._id} item={item} />
              ))}
            </div>

            <SheetFooter className="flex-col gap-3 px-0">
              <div className="flex items-center justify-between text-sm font-medium text-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <Button asChild size="lg" onClick={() => onOpenChange(false)}>
                <Link to={ROUTES.CHECKOUT}>Checkout</Link>
              </Button>
              <Button asChild variant="outline" onClick={() => onOpenChange(false)}>
                <Link to={ROUTES.CART}>View Cart</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
