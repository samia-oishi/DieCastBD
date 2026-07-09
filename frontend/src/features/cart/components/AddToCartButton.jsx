import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useCart } from "../api/useCart";

export function AddToCartButton({ product }) {
  const { items, addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const inCartQty = items.find((i) => i.product._id === product._id)?.qty ?? 0;
  const remaining = product.availableStock - inCartQty;
  const outOfStock = product.availableStock <= 0;

  const onAdd = () => {
    addItem(product, qty);
    setJustAdded(true);
    toast.success(`Added ${qty} to cart`);
    setTimeout(() => setJustAdded(false), 1500);
    setQty(1);
  };

  if (outOfStock) {
    return (
      <Button size="lg" disabled className="w-full">
        Sold Out
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          className="flex size-9 items-center justify-center text-muted-foreground disabled:opacity-40"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-medium">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(q + 1, remaining))}
          disabled={qty >= remaining}
          className="flex size-9 items-center justify-center text-muted-foreground disabled:opacity-40"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <Button size="lg" className="flex-1" onClick={onAdd} disabled={remaining <= 0}>
        {justAdded ? <Check /> : <ShoppingCart />}
        {remaining <= 0 ? "All in cart" : "Add to Cart"}
      </Button>
    </div>
  );
}
