import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/shared/ProductCard";

const GRID_CLS = "grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(235px,1fr))] md:gap-5";
const TILE_CLS = "h-[280px] animate-pulse rounded-[18px] bg-line-soft md:h-[340px] md:rounded-[20px]";

function GridSkeleton() {
  return (
    <div className={GRID_CLS}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={TILE_CLS} />
      ))}
    </div>
  );
}

/** Responsive product grid: 2-col on mobile (12px gap), auto-fill minmax(235px)
 * on desktop (20px gap), matching DiecastBD Shop.dc.html. */
/** `appendingCount` renders that many skeleton tiles AFTER the products, inside
 * the same grid container — infinite scroll needs "existing cards + N loading
 * tiles", which `isLoading` (all-or-nothing) can't express. They must share the
 * container: a second grid element would resolve its own auto-fill track widths
 * and visibly fail to line up with the cards above. Defaults to 0, so
 * CollectionPage's usage is unchanged. */
export function ProductGrid({ products, isLoading, appendingCount = 0 }) {
  if (isLoading) return <GridSkeleton />;

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <PackageSearch className="size-10 text-faint/50" strokeWidth={1.25} />
        <p className="text-muted-foreground">No products match these filters.</p>
      </div>
    );
  }

  return (
    <div className={GRID_CLS}>
      {products.map((product) => (
        <ProductCard key={product._id} product={product} variant="grid" />
      ))}
      {Array.from({ length: appendingCount }).map((_, i) => (
        <div key={`skeleton-${i}`} className={TILE_CLS} />
      ))}
    </div>
  );
}
