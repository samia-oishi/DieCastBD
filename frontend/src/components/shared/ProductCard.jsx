import { Link } from "react-router";
import { CarFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { WishlistButton } from "@/features/wishlist/components/WishlistButton";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

export function ProductCard({ product, className }) {
  const { slug, title, brand, price, salePrice, thumbnail, isNewArrival, availableStock } = product;
  const onSale = salePrice != null && salePrice < price;
  const outOfStock = availableStock <= 0;

  return (
    <Link
      to={`/products/${slug}`}
      className={cn("group flex flex-col gap-3", className)}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-card">
        {thumbnail?.url ? (
          <img
            src={thumbnail.url}
            alt={title}
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-secondary to-card">
            <CarFront className="size-10 text-muted-foreground/40" strokeWidth={1.25} />
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isNewArrival && (
            <Badge className="bg-primary text-primary-foreground">New</Badge>
          )}
          {onSale && <Badge className="bg-amber-400 text-background">Sale</Badge>}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="text-sm font-medium text-foreground">Sold Out</span>
          </div>
        )}

        <WishlistButton product={product} className="absolute right-2 top-2" />
      </div>

      <div className="flex flex-col gap-0.5">
        {brand?.name && <span className="text-xs text-muted-foreground">{brand.name}</span>}
        <h3 className="truncate text-sm font-medium text-foreground">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {formatPrice(onSale ? salePrice : price)}
          </span>
          {onSale && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
