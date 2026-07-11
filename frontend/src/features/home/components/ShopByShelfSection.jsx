import { Link } from "react-router";
import { ArrowRight, CarFront } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";

function ShelfTile({ label, href, imageUrl, imageFit = "cover" }) {
  return (
    <Link
      to={href}
      className="group relative block h-52.5 w-52.5 shrink-0 overflow-hidden rounded-[22px] bg-[#F1F2EA] transition-[box-shadow,transform] duration-180 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(16,18,8,.12)] md:h-95 md:w-full md:rounded-[28px]"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className={
            imageFit === "cover"
              ? "size-full object-cover"
              : "size-full object-contain p-10"
          }
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <CarFront className="size-12 text-muted-foreground/30" strokeWidth={1.25} />
        </div>
      )}
      <span className="absolute bottom-3 left-3 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold text-foreground shadow-[0_4px_14px_rgba(16,18,8,.14)] md:bottom-4.5 md:left-4.5 md:px-5 md:py-2.75 md:text-[15px] md:font-bold">
        {label}
      </span>
      <span className="absolute right-2.5 bottom-2.5 flex size-8.5 items-center justify-center rounded-full bg-brand text-ink shadow-[0_4px_14px_rgba(16,18,8,.16)] md:right-4 md:bottom-4 md:size-10.5">
        <ArrowRight className="size-3.5 md:size-4" />
      </span>
    </Link>
  );
}

/** "Shop by shelf" — brand + accessories category tiles, README §Screens.
 * Data-driven off the real catalog (useBrands/useCategories), not hardcoded
 * to "exactly 2 brands + accessories" — an admin adding a third brand later
 * just adds a fourth tile. Brand tiles use the logo (contained, tinted panel,
 * since a logo mark isn't shot photography); a category with a real `image`
 * renders as a proper full-bleed photo tile. */
export function ShopByShelfSection({ brands, categories }) {
  const accessoryCategory = categories?.find((c) => c.slug === "accessories" || /accessor/i.test(c.name));
  const tiles = [
    ...(brands ?? []).map((brand) => ({
      id: brand._id,
      label: brand.name,
      href: `/shop?brand=${brand.slug}`,
      imageUrl: brand.logo?.url,
      imageFit: "contain",
    })),
    ...(accessoryCategory
      ? [
          {
            id: accessoryCategory._id,
            label: "Protect & display",
            href: `/shop?category=${accessoryCategory.slug}`,
            imageUrl: accessoryCategory.image?.url,
            imageFit: "cover",
          },
        ]
      : []),
  ];

  if (!tiles.length) return null;

  return (
    <section className="pt-6 md:pt-19">
      <Container className="hidden md:block">
        <SectionHeader title="Shop by shelf" subtitle="Two brands we trust — and the gear that keeps them mint." />
        <div className="mt-6.5 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
          {tiles.map((tile) => (
            <ShelfTile key={tile.id} {...tile} />
          ))}
        </div>
      </Container>

      <div className="md:hidden">
        <div className="mb-3 flex items-baseline justify-between px-4">
          <span className="font-display text-xl font-bold">Shop by shelf</span>
          <Link to="/shop" className="text-[12.5px] font-semibold text-brand-deep">
            View all
          </Link>
        </div>
        <div className="scrollbar-none flex snap-x snap-proximity gap-3 overflow-x-auto scroll-pl-4 px-4 pb-1">
          {tiles.map((tile) => (
            <div key={tile.id} className="snap-start">
              <ShelfTile {...tile} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
