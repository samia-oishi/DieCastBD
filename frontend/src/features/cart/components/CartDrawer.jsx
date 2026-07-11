import { Link } from "react-router";
import { ShoppingBag, ArrowRight } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ROUTES } from "@/constants/routes";
import { formatTaka } from "@/lib/currency";
import { useCart } from "../api/useCart";
import { CartLineItem } from "./CartLineItem";

// Purely controlled sheet — SiteHeader / mobile app bar own the trigger buttons.
export function CartDrawer({ open, onOpenChange }) {
  const { items, subtotal, itemCount } = useCart();
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 bg-paper p-5">
        <SheetHeader className="px-0 pb-2">
          <SheetTitle className="font-display text-[19px] font-bold text-ink">
            Your cart{itemCount > 0 ? ` (${itemCount})` : ""}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-tile text-faint">
              <ShoppingBag className="size-6" strokeWidth={1.5} />
            </div>
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link to={ROUTES.SHOP} onClick={close} className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-brand-bright">
              Browse the collection
            </Link>
          </div>
        ) : (
          <>
            <div className="-mx-1 flex flex-1 flex-col gap-2.5 overflow-y-auto px-1 py-2">
              {items.map((item) => (
                <CartLineItem key={item.product._id} item={item} compact />
              ))}
            </div>

            <div className="mt-2 flex flex-col gap-3 border-t border-line pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold text-ink">{formatTaka(subtotal)}</span>
              </div>
              <Link to={ROUTES.CHECKOUT} onClick={close} className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-bold text-ink transition-colors hover:bg-brand-bright">
                Checkout <ArrowRight size={16} strokeWidth={2.2} />
              </Link>
              <Link to={ROUTES.CART} onClick={close} className="flex h-11 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-ink transition-colors hover:border-ink">
                View cart
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
