import { Link } from "react-router";
import { Minus, Plus, X, CarFront, TriangleAlert } from "lucide-react";

import { useCart } from "../api/useCart";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

export function CartLineItem({ item }) {
  const { updateQty, removeItem } = useCart();
  const { product, qty, lineTotal, stockIssue } = item;

  return (
    <div className="flex gap-3">
      <Link to={`/products/${product.slug}`} className="shrink-0">
        {product.thumbnail?.url ? (
          <img src={product.thumbnail.url} alt={product.title} className="size-16 rounded-lg object-cover" />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-lg bg-card">
            <CarFront className="size-6 text-muted-foreground/40" strokeWidth={1.25} />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <Link to={`/products/${product.slug}`} className="text-sm font-medium text-foreground hover:text-primary">
          {product.title}
        </Link>
        <span className="text-sm text-muted-foreground">{formatPrice(product.salePrice ?? product.price)}</span>

        {stockIssue && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <TriangleAlert className="size-3" />
            Only {stockIssue.availableStock} left — reduce quantity
          </span>
        )}

        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border">
            <button
              type="button"
              onClick={() => updateQty(product._id, qty - 1)}
              disabled={qty <= 1}
              className="flex size-7 items-center justify-center text-muted-foreground disabled:opacity-40"
            >
              <Minus className="size-3" />
            </button>
            <span className="w-6 text-center text-xs font-medium">{qty}</span>
            <button
              type="button"
              onClick={() => updateQty(product._id, qty + 1)}
              disabled={qty >= product.availableStock}
              className="flex size-7 items-center justify-center text-muted-foreground disabled:opacity-40"
            >
              <Plus className="size-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(product._id)}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between">
        <span className="text-sm font-semibold text-foreground">{formatPrice(lineTotal)}</span>
        <button
          type="button"
          onClick={() => removeItem(product._id)}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Remove item"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
