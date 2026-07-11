import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/shared/ProductCard";

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(235px,1fr))] md:gap-5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-[280px] animate-pulse rounded-[18px] bg-line-soft md:h-[340px] md:rounded-[20px]" />
      ))}
    </div>
  );
}

/** Responsive product grid: 2-col on mobile (12px gap), auto-fill minmax(235px)
 * on desktop (20px gap), matching DiecastBD Shop.dc.html. */
export function ProductGrid({ products, isLoading }) {
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(235px,1fr))] md:gap-5">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} variant="grid" />
      ))}
    </div>
  );
}
