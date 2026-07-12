import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { useDragScroll } from "@/hooks/useDragScroll";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

function Tile({ href, label, image, className }) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative block shrink-0 overflow-hidden rounded-[22px] bg-tile transition-[box-shadow,transform] duration-[180ms] md:hover:-translate-y-0.5 md:hover:shadow-[0_12px_32px_rgba(16,18,8,0.12)] md:rounded-[28px]",
        className
      )}
    >
      {image?.url ? (
        <img
          src={image.url}
          alt={label}
          className="size-full object-cover"
        />
      ) : (
        <div className="size-full bg-tile" />
      )}
      <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold shadow-[0_4px_14px_rgba(16,18,8,0.14)] md:bottom-[18px] md:left-[18px] md:px-5 md:py-[11px] md:text-[15px] md:font-bold">
        {label}
      </span>
      <span className="absolute bottom-2.5 right-2.5 flex size-[34px] items-center justify-center rounded-full bg-brand text-ink shadow-[0_4px_14px_rgba(16,18,8,0.16)] md:bottom-4 md:right-4 md:size-[42px]">
        <ArrowRight size={13} strokeWidth={2.4} className="md:size-4" />
      </span>
    </Link>
  );
}

/** "Shop by shelf" — data-driven tiles for the two brands plus an accessories
 * ("Protect & display") tile. Mobile: horizontal snap row of 210px tiles;
 * desktop: 380px grid. */
export function ShopByShelf({ brands, categories }) {
  const { ref, dragProps } = useDragScroll();
  const hw = brands?.find((b) => b.slug === "hot-wheels-premium");
  const mini = brands?.find((b) => b.slug === "mini-gt");
  const accessories = categories?.find((c) => c.slug === "accessories");

  const tiles = [
    hw && { href: "/shop?brand=hot-wheels-premium", label: hw.name, image: hw.logo },
    mini && { href: "/shop?brand=mini-gt", label: mini.name, image: mini.logo },
    accessories && { href: "/shop?category=accessories", label: "Protect & display", image: accessories.image },
  ].filter(Boolean);

  if (!tiles.length) return null;

  return (
    <section className="pt-6 md:pt-[76px]">
      <Container>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-ink md:text-[30px]">Shop by shelf</h2>
          <Link to={ROUTES.SHOP} className="text-[12.5px] font-semibold text-brand-deep md:hidden">View all</Link>
        </div>
        <p className="mt-1.5 hidden text-[14.5px] text-muted-foreground md:mt-[7px] md:block">Two brands we trust — and the gear that keeps them mint.</p>
      </Container>

      {/* Mobile: horizontal drag row */}
      <div ref={ref} {...dragProps} data-carousel className="mt-3 flex snap-x snap-proximity gap-3 scroll-pl-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        {tiles.map((t) => (
          <Tile key={t.href} {...t} className="size-[210px] snap-start" />
        ))}
      </div>

      {/* Desktop: grid */}
      <Container className="mt-[26px] hidden md:block">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
          {tiles.map((t) => (
            <Tile key={t.href} {...t} className="h-[380px]" />
          ))}
        </div>
      </Container>
    </section>
  );
}
