import { useEffect } from "react";
import { useParams } from "react-router";
import { Helmet } from "react-helmet-async";

import { SITE_URL, canonical } from "@/lib/siteUrl";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { NotFoundPage } from "@/components/shared/NotFoundPage";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ProductCarouselSection } from "@/components/shared/ProductCarouselSection";
import { Container } from "@/components/shared/Container";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { useProduct, useRelatedProducts } from "./api/useProducts";
import { WishlistButton } from "@/features/wishlist/components/WishlistButton";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { useRecentlyViewedStore } from "@/stores/recentlyViewedStore";
import { ProductGallery } from "./components/ProductGallery";
import { ProductSpecs } from "./components/ProductSpecs";
import { ShareButton } from "./components/ShareButton";

function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: related } = useRelatedProducts(slug);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);
  const recentlyViewed = useRecentlyViewedStore((s) => s.items);

  useEffect(() => {
    if (product) addRecentlyViewed(product);
  }, [product, addRecentlyViewed]);

  if (isLoading) return <FullPageLoader />;
  if (isError || !product) return <NotFoundPage />;

  const onSale = product.salePrice != null && product.salePrice < product.price;
  const outOfStock = product.availableStock <= 0;
  const otherRecentlyViewed = recentlyViewed.filter((p) => p._id !== product._id);

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
      price: onSale ? product.salePrice : product.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "DiecastBD" },
    },
  };

  return (
    <>
      <Helmet>
        <title>{product.seo?.title || `${product.title} — Buy in Bangladesh | DiecastBD`}</title>
        <meta
          name="description"
          content={
            product.seo?.description ||
            `Buy the ${product.title} in Bangladesh at DiecastBD${
              product.brand?.name ? ` — authentic ${product.brand.name}` : ""
            }, 1:64 scale. ${product.description?.slice(0, 90) ?? ""}`.slice(0, 160)
          }
        />
        <link rel="canonical" href={product.seo?.canonicalUrl || productUrl} />
        <meta property="og:title" content={product.title} />
        <meta property="og:description" content={product.description} />
        {product.thumbnail?.url && <meta property="og:image" content={product.thumbnail.url} />}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={productUrl} />
        <meta property="product:price:amount" content={onSale ? product.salePrice : product.price} />
        <meta property="product:price:currency" content="BDT" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Container className="py-8">
        <Breadcrumb
          items={[
            { label: "Home", to: ROUTES.HOME },
            { label: "Shop", to: ROUTES.SHOP },
            ...(product.brand?.name
              ? [{ label: product.brand.name, to: `${ROUTES.SHOP}?brand=${product.brand.slug}` }]
              : []),
            { label: product.title },
          ]}
        />

        <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ProductGallery thumbnail={product.thumbnail} gallery={product.gallery} title={product.title} />

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              {product.brand?.name && (
                <span className="text-sm text-muted-foreground">{product.brand.name}</span>
              )}
              <h1 className="font-heading text-2xl text-foreground sm:text-3xl">{product.title}</h1>
              {product.sku && <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {product.isNewArrival && <Badge className="bg-primary text-primary-foreground">New</Badge>}
              {product.isHeroProduct && <Badge variant="outline">Collector Pick</Badge>}
              {outOfStock && <Badge variant="destructive">Sold Out</Badge>}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold text-foreground">
                {formatPrice(onSale ? product.salePrice : product.price)}
              </span>
              {onSale && (
                <span className="text-base text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {outOfStock ? "Currently out of stock." : `${product.availableStock} in stock.`}
            </p>

            <AddToCartButton product={product} />

            <div className="flex items-center gap-2">
              <WishlistButton product={product} showLabel />
              <ShareButton title={product.title} />
            </div>

            {product.description && (
              <div>
                <h2 className="mb-2 font-heading text-lg text-foreground">Description</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              </div>
            )}

            <ProductSpecs product={product} />
          </div>
        </div>
      </Container>

      <ProductCarouselSection title="Related Products" products={related} isLoading={false} />
      <ProductCarouselSection
        title="Recently Viewed"
        products={otherRecentlyViewed}
        isLoading={false}
      />
    </>
  );
}
