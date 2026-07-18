import { useEffect } from "react";
import { Link } from "react-router";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/shared/ProductCard";
import { Markdown } from "./blockMarkdown";

/** Offer-banner palettes — must match the admin editor's preview. */
const OFFER_THEMES = {
  Lime: ["#C9E469", "#101208"],
  "Dark green": ["#00240c", "#EFF5DC"],
  Ink: ["#101208", "#FAFAF7"],
};

const HEADING_CLS = {
  H1: "font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink md:text-[36px]",
  H2: "font-display text-[22px] font-extrabold tracking-[-0.015em] text-ink md:text-[27px]",
  H3: "font-display text-[17.5px] font-bold text-ink md:text-[20px]",
};

const COLUMNS_CLS = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
};

/** Blocks reference products by slug, so order follows the block, not the query. */
function pickProducts(block, bySlug, featured) {
  if (block.featured) return featured;
  return (block.picked ?? []).map((slug) => bySlug.get(slug)).filter(Boolean);
}

function Carousel({ block, products }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    block.autoplay ? [Autoplay({ delay: 4000, stopOnInteraction: true })] : []
  );

  // Slide count can change when a product is unpublished; re-measure so the
  // carousel doesn't keep scrolling to a slide that no longer exists.
  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, block.source, products.length, (block.slides ?? []).length]);

  const slides =
    block.source === "Products"
      ? products.map((p) => (
          <div key={p.slug} className="min-w-0 shrink-0 basis-[70%] pl-3 sm:basis-[45%] lg:basis-[30%]">
            <ProductCard product={p} />
          </div>
        ))
      : (block.slides ?? [])
          .filter(Boolean)
          .map((src, i) => (
            <div key={i} className="min-w-0 shrink-0 basis-[85%] pl-3 sm:basis-[60%]">
              <img src={src} alt="" loading="lazy" className="h-full w-full rounded-[16px] object-cover" />
            </div>
          ));

  if (slides.length === 0) return null;

  return (
    <div ref={emblaRef} className="overflow-hidden">
      <div className="-ml-3 flex">{slides}</div>
    </div>
  );
}

function Block({ block, bySlug, featured }) {
  switch (block.type) {
    case "heading": {
      const Tag = (block.level ?? "H2").toLowerCase();
      return block.text ? <Tag className={HEADING_CLS[block.level] ?? HEADING_CLS.H2}>{block.text}</Tag> : null;
    }

    case "text":
      return <Markdown text={block.text} className="flex flex-col gap-3 text-[14.5px] leading-[1.7] text-ink-soft" />;

    case "image":
      return block.url ? (
        <figure className="flex flex-col gap-2">
          <img src={block.url} alt={block.alt ?? ""} loading="lazy" className="w-full rounded-[16px] object-cover" />
          {block.caption && <figcaption className="text-[12.5px] text-faint">{block.caption}</figcaption>}
        </figure>
      ) : null;

    case "carousel":
      return <Carousel block={block} products={pickProducts(block, bySlug, featured)} />;

    case "products": {
      const products = pickProducts(block, bySlug, featured);
      if (products.length === 0) return null;
      return (
        <div className={cn("grid gap-3 md:gap-4", COLUMNS_CLS[block.columns] ?? COLUMNS_CLS[3])}>
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} hidePrice={!block.showPrice} />
          ))}
        </div>
      );
    }

    case "button": {
      if (!block.text) return null;
      const cls = cn(
        "inline-flex h-11 w-fit items-center justify-center rounded-full px-6 font-display text-[13.5px] font-bold transition-colors",
        block.variant === "Ink outline"
          ? "border-[1.5px] border-ink text-ink hover:bg-ink hover:text-white"
          : "bg-brand text-ink hover:bg-brand-bright"
      );
      const href = block.link || "/";
      return href.startsWith("/") ? (
        <Link to={href} className={cls}>{block.text}</Link>
      ) : (
        <a href={href} target="_blank" rel="noreferrer noopener" className={cls}>{block.text}</a>
      );
    }

    case "offer": {
      const [bg, fg] = OFFER_THEMES[block.theme] ?? OFFER_THEMES.Lime;
      return (
        <div className="rounded-[18px] px-6 py-6 md:px-8 md:py-7" style={{ background: bg, color: fg }}>
          {block.kicker && (
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] opacity-80">{block.kicker}</div>
          )}
          {block.title && (
            <div className="mt-1.5 font-display text-[24px] font-extrabold tracking-[-0.02em] md:text-[30px]">
              {block.title}
            </div>
          )}
          {(block.desc || block.code) && (
            <div className="mt-2 text-[13.5px] opacity-90">
              {block.desc}
              {block.code && (
                <>
                  {block.desc ? " · " : ""}code{" "}
                  <strong className="font-bold tracking-[0.04em]">{block.code}</strong>
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    case "divider":
      return <hr className="border-t border-line" />;

    default:
      // An unknown type means the API grew a block this build doesn't render.
      // Skipping beats crashing the page around it.
      return null;
  }
}

/** Renders a page's blocks.
 *
 * Half-width blocks pair up on desktop: consecutive `Half` blocks are grouped
 * into a two-column row, which is what "two half-width blocks sit side by side"
 * means in the builder. Everything is single-column on mobile.
 */
export function BlockRenderer({ blocks = [], products = [], className }) {
  if (blocks.length === 0) return null;

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const featured = products.filter((p) => p.isFeatured);

  const rows = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const next = blocks[i + 1];
    if (block.width === "Half" && next?.width === "Half") {
      rows.push([block, next]);
      i += 1;
    } else {
      rows.push([block]);
    }
  }

  return (
    <div className={cn("flex flex-col gap-7", className)}>
      {rows.map((row, ri) =>
        row.length === 2 ? (
          <div key={ri} className="grid grid-cols-1 gap-7 md:grid-cols-2">
            {row.map((block, bi) => (
              <Block key={bi} block={block} bySlug={bySlug} featured={featured} />
            ))}
          </div>
        ) : (
          <Block key={ri} block={row[0]} bySlug={bySlug} featured={featured} />
        )
      )}
    </div>
  );
}
