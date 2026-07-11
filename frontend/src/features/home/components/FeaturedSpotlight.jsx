import { Link } from "react-router";
import { CarFront, Plus, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { WishlistButton } from "@/features/wishlist/components/WishlistButton";
import { useCart } from "@/features/cart/api/useCart";
import { formatPrice } from "@/lib/currency";
import { productThumbUrl } from "@/lib/cloudinary";
import { ROUTES } from "@/constants/routes";

function SpotlightCard({ product }) {
  const { addItem } = useCart();
  const outOfStock = product.availableStock <= 0;

  const onAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success("Added to cart");
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-shadow duration-[180ms] ease-out hover:shadow-[0_12px_32px_rgba(16,18,8,.1)]"
    >
      <div className="relative h-47.5 bg-brand-soft md:h-82.5">
        {product.thumbnail?.url ? (
          <img src={productThumbUrl(product.thumbnail.url)} alt={product.title} className="size-full object-contain p-6" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <CarFront className="size-14 text-muted-foreground/30" strokeWidth={1.25} />
          </div>
        )}
        {product.isNewArrival && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-ink px-2.75 py-1 text-[9px] font-bold tracking-wide text-white uppercase md:top-3.5 md:left-3.5 md:text-[10.5px]">
            New
          </span>
        )}
        <WishlistButton product={product} className="absolute top-3 right-3 hidden md:flex" />
      </div>
      <div className="flex flex-1 flex-col p-3.5 md:p-6">
        <div className="text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase md:text-[10.5px]">{product.brand?.name}</div>
        <div className="mt-1 font-display text-base leading-[1.25] font-bold text-foreground md:mt-1.5 md:text-[22px]">{product.title}</div>
        {product.description && (
          <p className="mt-2 hidden text-sm leading-relaxed text-muted-foreground md:block md:line-clamp-2">{product.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between md:mt-auto md:pt-4.5">
          <span className="text-base font-bold text-foreground md:text-xl">{formatPrice(product.salePrice ?? product.price)}</span>
          <button
            type="button"
            onClick={onAdd}
            disabled={outOfStock}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#5F7A10] disabled:opacity-50 md:gap-2.25 md:px-5.5 md:py-3"
          >
            {outOfStock ? "Sold out" : "Add to cart"}
            {!outOfStock && <ShoppingBag className="size-3.5 md:size-[15px]" />}
          </button>
        </div>
      </div>
    </Link>
  );
}

function RowCard({ product }) {
  const { addItem } = useCart();

  const onAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success("Added to cart");
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5 pl-2.5 transition-shadow duration-[180ms] ease-out hover:shadow-[0_12px_32px_rgba(16,18,8,.1)] md:gap-4 md:p-3.5 md:pl-3.5"
    >
      <div className="relative size-17.5 shrink-0 overflow-hidden rounded-xl bg-[#F1F2EA] md:size-28">
        {product.thumbnail?.url ? (
          <img src={productThumbUrl(product.thumbnail.url)} alt={product.title} className="size-full object-contain p-2" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <CarFront className="size-6 text-muted-foreground/30" strokeWidth={1.25} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-semibold tracking-wide text-muted-foreground uppercase md:text-[10.5px]">{product.brand?.name}</div>
        <div className="mt-0.75 truncate text-[12.5px] font-semibold text-foreground md:text-[15.5px]">{product.title}</div>
        <div className="mt-0.75 text-[13px] font-bold text-foreground md:text-[15.5px]">{formatPrice(product.salePrice ?? product.price)}</div>
      </div>
      <button
        type="button"
        onClick={onAdd}
        aria-label="Add to cart"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-[#5F7A10]"
      >
        <Plus className="size-3.5" strokeWidth={2.4} />
      </button>
    </Link>
  );
}

/** "Featured products" — a spotlight card + up to 3 row cards, not a
 * carousel (README §Key Components: FeaturedSpotlight). item[0] is the
 * spotlight, items[1..3] the rows, sourced from the same `featured` flag
 * query the rest of the section already used. */
export function FeaturedSpotlight({ products, isLoading }) {
  if (!isLoading && (!products || products.length === 0)) return null;

  const [spotlight, ...rows] = products ?? [];

  return (
    <section className="pt-6 md:pt-19">
      <Container>
        <SectionHeader title="Featured products" subtitle="This week's spotlight — one centerpiece, three strong seconds." seeAllHref={ROUTES.SHOP} />
        {isLoading ? (
          <div className="mt-6.5 h-82.5 animate-pulse rounded-3xl bg-card" />
        ) : (
          <div className="mt-6.5 grid grid-cols-1 items-stretch gap-4 md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))] md:gap-5">
            {spotlight && <SpotlightCard product={spotlight} />}
            {rows.length > 0 && (
              <div className="flex flex-col gap-2.5 md:gap-4">
                {rows.slice(0, 3).map((product) => (
                  <RowCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
