import { PackageSearch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/shared/ProductCard";

// Reference: mobile is a fixed 2-column grid (12px gap); desktop is
// auto-fill with a 235px minimum card (20px gap), not a fixed column count —
// so the last row never leaves an odd lonely card stretched full-width.
const GRID_CLASS = "grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(235px,1fr))] md:gap-5";

function GridSkeleton() {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full rounded-[18px]" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ProductGrid({ products, isLoading }) {
  if (isLoading) return <GridSkeleton />;

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <PackageSearch className="size-10 text-muted-foreground/40" strokeWidth={1.25} />
        <p className="text-muted-foreground">No products match these filters.</p>
      </div>
    );
  }

  return (
    <div className={GRID_CLASS}>
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
