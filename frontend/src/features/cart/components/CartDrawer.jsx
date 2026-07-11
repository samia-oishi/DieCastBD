import { Link } from "react-router";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ROUTES } from "@/constants/routes";
import { formatTaka } from "@/lib/currency";
import { useCart } from "../api/useCart";
import { CartLineItem } from "./CartLineItem";

const formatPrice = formatTaka;

// Purely controlled sheet — SiteHeader (desktop) and the mobile app bar own the
// trigger buttons, so the drawer no longer renders its own.
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
