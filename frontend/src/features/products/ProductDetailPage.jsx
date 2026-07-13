import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Helmet } from "react-helmet-async";
import { Minus, Plus, ShoppingBag, Share2, Bell, Check } from "lucide-react";
import toast from "react-hot-toast";

import { canonical } from "@/lib/siteUrl";
import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { ROUTES } from "@/constants/routes";
import { Seo } from "@/components/shared/Seo";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ProductCarousel } from "@/components/shared/ProductCarousel";
import { Container } from "@/components/shared/Container";
import { useCart } from "@/features/cart/api/useCart";
import { useAddToCart } from "@/features/cart/api/useAddToCart";
import { WishlistButton } from "@/features/wishlist/components/WishlistButton";
import { RestockAlertDialog } from "@/components/shared/RestockAlertDialog";
import { useRestockAlertStore } from "@/stores/restockAlertStore";
import { useRecentlyViewedStore } from "@/stores/recentlyViewedStore";
import { useProduct, useRelatedProducts } from "./api/useProducts";
import { ProductGallery } from "./components/ProductGallery";
import { ProductSpecs } from "./components/ProductSpecs";
import { ReassuranceCard } from "./components/ReassuranceCard";
import { StickyBuyBar } from "./components/StickyBuyBar";

const CIRCLE_BTN = "flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-brand";

function Badge({ tone, children }) {
  const styles = {
    ink: "bg-ink text-white",
    outline: "border-[1.5px] border-ink text-ink",
    muted: "bg-tile text-ink-soft",
  };
  return (
    <span className={cn("rounded-full px-3 py-[5px] text-[10.5px] font-bold uppercase tracking-[0.07em]", styles[tone])}>{children}</span>
  );
}

function ShareCircle({ title }) {
  const onShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* cancelled */ }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };
  return (
    <button type="button" onClick={onShare} aria-label="Share" className={CIRCLE_BTN}>
      <Share2 size={16} strokeWidth={1.8} />
    </button>
  );
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: related } = useRelatedProducts(slug);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);
  const recentlyViewed = useRecentlyViewedStore((s) => s.items);
  const { items } = useCart();
  const addToCart = useAddToCart();
  const [qty, setQty] = useState(1);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const isAlerted = useRestockAlertStore((s) => (product ? s.isAlerted(product._id) : false));

  useEffect(() => {
    if (product) addRecentlyViewed(product);
  }, [product, addRecentlyViewed]);

  useEffect(() => setQty(1), [slug]);

  if (isLoading) return <FullPageLoader />;
  if (isError || !product) return <NotFoundPage />;

  const onSale = product.salePrice != null && product.salePrice < product.price;
  const price = onSale ? product.salePrice : product.price;
  const outOfStock = product.availableStock <= 0;
  const inCartQty = items.find((i) => i.product._id === product._id)?.qty ?? 0;
  const maxQty = Math.max(1, product.availableStock - inCartQty);
  const lowStock = product.availableStock > 0 && product.availableStock <= 3;
  const otherRecentlyViewed = recentlyViewed.filter((p) => p._id !== product._id);

  const onAdd = () => {
    if (addToCart(product, qty)) setQty(1);
  };
  const onBuyNow = () => navigate(ROUTES.CHECKOUT, { state: { buyNowItem: { product, qty } } });

  const productUrl = canonical(`/products/${product.slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: product.sku,
    ...(product.modelNumber ? { mpn: product.modelNumber } : {}),
    brand: product.brand?.name ? { "@type": "Brand", name: product.brand.name } : undefined,
    image: [product.thumbnail?.url, ...(product.gallery ?? []).map((g) => g.url)].filter(Boolean),
    description: product.description,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price,
      itemCondition: "https://schema.org/NewCondition",
      availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "DiecastBD" },
    },
  };

  const kicker = [product.brand?.name, product.sku && `SKU ${product.sku}`].filter(Boolean).join(" · ");

  // Shared price + badges + low-stock block (rendered in both layouts).
  const PriceBlock = ({ size }) => (
    <>
      <div className={cn("flex items-center", size === "lg" ? "gap-3" : "gap-2.5")}>
        <span className={cn("font-display font-extrabold tracking-[-0.01em] text-ink", size === "lg" ? "text-[32px]" : "text-[24px]")}>{formatTaka(price)}</span>
        {onSale && <span className={cn("font-medium text-[#A2A597] line-through", size === "lg" ? "text-[17px]" : "text-sm")}>{formatTaka(product.price)}</span>}
        {onSale && <span className="rounded-full bg-brand-tint px-3 py-1.5 text-[11px] font-bold text-brand-deep md:text-xs">Save {formatTaka(product.price - price)}</span>}
      </div>
      {lowStock && (
        <div className={cn("flex items-center gap-2", size === "lg" ? "mt-3.5" : "mt-2.5")}>
          <span className="size-2 rounded-full bg-warn" />
          <span className={cn("font-semibold text-warn", size === "lg" ? "text-[13.5px]" : "text-[12.5px]")}>Only {product.availableStock} left — premium runs don't restock</span>
        </div>
      )}
    </>
  );

  // Out-of-stock CTA — collects a back-in-stock alert signup, mirroring the
  // ProductCard "Notify me" pattern (same RestockAlertDialog + store). Flips to
  // a confirmed state once the visitor has subscribed to this product.
  const NotifyButton = ({ className }) => (
    <button
      type="button"
      onClick={isAlerted ? undefined : () => setNotifyOpen(true)}
      className={cn(
        "flex items-center justify-center gap-2.5 rounded-full border-[1.5px] font-bold transition-colors",
        isAlerted ? "cursor-default border-brand text-brand-deep" : "border-ink text-ink hover:bg-ink hover:text-white",
        className
      )}
    >
      {isAlerted ? <Check size={17} strokeWidth={2.2} /> : <Bell size={16} strokeWidth={1.9} />}
      {isAlerted ? "We'll alert you when it's back" : "Notify me when available"}
    </button>
  );

  return (
    <>
      <Seo title={product.seo?.title ? product.seo.title : `${product.title} — Buy in Bangladesh`} noTemplate={!!product.seo?.title} description={product.seo?.description || `Buy the ${product.title} in Bangladesh at DiecastBD. ${product.description?.slice(0, 100) ?? ""}`.slice(0, 160)}>
        <link rel="canonical" href={product.seo?.canonicalUrl || productUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={productUrl} />
        {product.thumbnail?.url && <meta property="og:image" content={product.thumbnail.url} />}
      </Seo>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* ---------- Desktop ---------- */}
      <div className="hidden md:block">
        <Container className="pt-6">
          <Breadcrumb
            items={[
              { label: "Home", to: ROUTES.HOME },
              { label: "Shop", to: ROUTES.SHOP },
              ...(product.brand?.name ? [{ label: product.brand.name, to: `${ROUTES.SHOP}?brand=${product.brand.slug}` }] : []),
              { label: product.title },
            ]}
          />
        </Container>

        <Container className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(420px,1fr))] items-start gap-12">
          <ProductGallery thumbnail={product.thumbnail} gallery={product.gallery} title={product.title} isNew={product.isNewArrival} />

          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-[0.1em] text-faint">{kicker}</div>
              <div className="flex gap-2.5">
                <WishlistButton product={product} className={cn(CIRCLE_BTN, "border")} />
                <ShareCircle title={product.title} />
              </div>
            </div>

            <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.15] tracking-[-0.015em] text-ink">{product.title}</h1>

            <div className="mt-3.5 flex gap-2">
              {product.isPreOrderActive && <Badge tone="ink">Pre-order</Badge>}
              {product.isNewArrival && <Badge tone="ink">New</Badge>}
              {product.isHeroProduct && <Badge tone="outline">Collector Pick</Badge>}
              {outOfStock && <Badge tone="muted">Sold Out</Badge>}
            </div>

            <div className="mt-5"><PriceBlock size="lg" /></div>

            {outOfStock ? (
              <NotifyButton className="mt-6 h-[52px] w-full text-[15px]" />
            ) : (
              <>
                <div className="mt-6 flex gap-3">
                  <div className="flex h-[52px] items-center rounded-full border border-line bg-white">
                    <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="flex h-[52px] w-12 items-center justify-center text-ink disabled:opacity-30">
                      <Minus size={14} strokeWidth={2.2} />
                    </button>
                    <span className="min-w-7 text-center text-base font-bold text-ink tabular-nums">{qty}</span>
                    <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Increase quantity" className="flex h-[52px] w-12 items-center justify-center text-ink disabled:opacity-30">
                      <Plus size={14} strokeWidth={2.2} />
                    </button>
                  </div>
                  <button type="button" onClick={onAdd} className="flex h-[52px] flex-1 items-center justify-center gap-2.5 rounded-full bg-brand text-[15.5px] font-bold text-ink transition-colors hover:bg-brand-bright">
                    <ShoppingBag size={17} strokeWidth={1.9} /> Add to cart
                  </button>
                </div>
                <button type="button" onClick={onBuyNow} className="mt-3 flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-[#2A2E1C]">
                  {product.isPreOrderActive ? "Pre-order now" : "Buy now — pay on delivery"}
                </button>
              </>
            )}

            <ReassuranceCard className="mt-6" />

            {product.description && (
              <div className="mt-7">
                <div className="font-display text-lg font-bold text-ink">Description</div>
                <p className="mt-2.5 text-[14.5px] leading-[1.7] text-ink-soft">{product.description}</p>
              </div>
            )}

            <ProductSpecs product={product} className="mt-[26px]" />
          </div>
        </Container>
      </div>

      {/* ---------- Mobile ---------- */}
      <div className="pb-24 md:hidden">
        <div className="mx-4 mt-3">
          <ProductGallery thumbnail={product.thumbnail} gallery={product.gallery} title={product.title} isNew={product.isNewArrival} />
        </div>
        <div className="mx-4 mt-[18px]">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-faint">{kicker}</div>
          <h1 className="mt-2 font-display text-[23px] font-extrabold leading-[1.2] tracking-[-0.01em] text-ink">{product.title}</h1>
          <div className="mt-3"><PriceBlock size="sm" /></div>
          {outOfStock && <NotifyButton className="mt-4 h-12 w-full text-[14px]" />}
          {product.description && <p className="mt-3.5 text-[13.5px] leading-[1.65] text-ink-soft">{product.description}</p>}
        </div>
        <ReassuranceCard className="mx-4 mt-[18px]" />
        <ProductSpecs product={product} className="mx-4 mt-6" />
      </div>

      {/* Related + Recently viewed (both breakpoints) */}
      {related?.length > 0 && (
        <ProductCarousel title="Related products" products={related} className="pt-8 md:pt-[76px]" viewAllHref={ROUTES.SHOP} />
      )}
      {otherRecentlyViewed.length > 0 && (
        <ProductCarousel title="Recently viewed" products={otherRecentlyViewed} className="pt-6 md:pt-[52px]" />
      )}

      <StickyBuyBar qty={qty} onQty={setQty} max={maxQty} onAdd={onAdd} onBuyNow={onBuyNow} outOfStock={outOfStock} />

      {outOfStock && (
        <RestockAlertDialog product={product} open={notifyOpen} onOpenChange={setNotifyOpen} />
      )}
    </>
  );
}
