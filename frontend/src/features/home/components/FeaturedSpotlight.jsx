import { useNavigate } from "react-router";
import { ShoppingBag, Plus } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { WishlistButton } from "@/features/wishlist/components/WishlistButton";
import { useAddToCart } from "@/features/cart/api/useAddToCart";
import { formatTaka } from "@/lib/currency";
import { cloudinaryCard } from "@/lib/cloudinary";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

function Spotlight({ product }) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const add = (product, e) => { e?.stopPropagation(); addToCart(product, 1); };
  const price = product.salePrice ?? product.price;
  return (
    <div
      onClick={() => navigate(`/products/${product.slug}`)}
      className="flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-line bg-white transition-shadow duration-[180ms] md:hover:shadow-[0_12px_32px_rgba(16,18,8,0.1)] md:rounded-[24px]"
    >
      <div className="relative flex h-[190px] items-center justify-center overflow-hidden bg-brand-tint md:h-[330px]">
        {product.thumbnail?.url && <img src={cloudinaryCard(product.thumbnail.url)} alt={product.title} loading="lazy" decoding="async" className="h-full w-auto max-w-none" />}
        {(product.isPreOrderActive || product.isNewArrival) && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-ink px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-white md:left-3.5 md:top-3.5 md:px-[11px] md:py-[5px] md:text-[10.5px] md:tracking-[0.07em]">
            {product.isPreOrderActive ? "Pre-order" : "NEW"}
          </span>
        )}
        <WishlistButton product={product} className="absolute right-3 top-3 size-[34px] border-0 bg-white/[0.94] text-ink shadow-[0_1px_4px_rgba(16,18,8,0.12)] hover:bg-white" />
      </div>
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-faint md:text-[10.5px] md:tracking-[0.09em]">{product.brand?.name}</div>
        <div className="mt-[5px] font-display text-[16.5px] font-bold leading-[1.25] text-ink md:mt-1.5 md:text-[22px]">{product.title}</div>
        {product.description && <p className="mt-2 hidden text-sm leading-[1.6] text-muted-foreground md:block">{product.description}</p>}
        <div className="mt-3 flex items-center justify-between md:mt-auto md:pt-[18px]">
          <span className="text-base font-bold text-ink md:text-xl">{formatTaka(price)}</span>
          <button type="button" onClick={(e) => add(product, e)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#5F7A10] md:gap-[9px] md:px-[22px] md:py-3 md:text-sm">
            Add to cart <ShoppingBag size={15} strokeWidth={1.8} className="hidden md:block" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RowCard({ product, className }) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const add = (product, e) => { e?.stopPropagation(); addToCart(product, 1); };
  const price = product.salePrice ?? product.price;
  return (
    <div
      onClick={() => navigate(`/products/${product.slug}`)}
      className={cn("flex flex-1 cursor-pointer items-center gap-3 rounded-[16px] border border-line bg-white p-2.5 pr-3.5 transition-shadow duration-[180ms] md:hover:shadow-[0_12px_32px_rgba(16,18,8,0.1)] md:gap-4 md:rounded-[20px] md:p-[14px] md:pl-[14px] md:pr-[18px]", className)}
    >
      <div className="relative flex size-[74px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-tile md:h-[112px] md:w-[124px] md:rounded-[14px]">
        {product.thumbnail?.url && <img src={cloudinaryCard(product.thumbnail.url)} alt={product.title} loading="lazy" decoding="async" className="h-full w-auto max-w-none" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-semibold uppercase tracking-[0.08em] text-faint md:text-[10.5px] md:tracking-[0.09em]">{product.brand?.name}</div>
        <div className="my-[3px] line-clamp-2 text-[12.5px] font-semibold leading-[1.3] text-ink md:my-1.5 md:text-[15.5px] md:leading-[1.35]">{product.title}</div>
        <div className="text-[13px] font-bold text-ink md:text-[15.5px]">{formatTaka(price)}</div>
      </div>
      <button type="button" onClick={(e) => add(product, e)} aria-label="Add to cart" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-[#5F7A10]">
        <Plus size={13} strokeWidth={2.2} />
      </button>
    </div>
  );
}

/** Featured products: one spotlight card + up to 3 row cards (2 on mobile). */
export function FeaturedSpotlight({ products, className }) {
  if (!products?.length) return null;
  const [spotlight, ...rows] = products;
  return (
    <section className={cn("pt-6 md:pt-[76px]", className)}>
      <Container>
        <SectionHeader title="Featured products" subtitle="This week's spotlight — one centerpiece, three strong seconds." viewAllHref={ROUTES.SHOP} />
        <div className="mt-3 grid gap-4 md:mt-[26px] md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))] md:items-stretch">
          <Spotlight product={spotlight} />
          <div className="flex flex-col gap-2.5 md:gap-4">
            {rows.slice(0, 3).map((p, i) => (
              <RowCard key={p._id} product={p} className={i === 2 ? "hidden md:flex" : ""} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
