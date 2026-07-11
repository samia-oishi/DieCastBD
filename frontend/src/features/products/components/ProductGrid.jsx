import { PackageSearch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/shared/ProductCard";

// Reference: mobile is a fixed 2-column grid (12px gap); desktop is
// auto-fill with a minimum card width (20px gap), not a fixed column count —
// so the last row never leaves an odd lonely card stretched full-width.
// The reference's own literal value (235px) actually only fits 3 columns
// once the 250px filter sidebar + 36px gap are subtracted from a 1360px
// content width (994px remaining / (235+20px gap) rounds down to 3, not
// 4) — verified by computing Grid's actual auto-fill formula, not just
// eyeballing it. Lowered to 210px, which reliably fits 4 at the sidebar
// layout's real available width while still auto-collapsing to fewer
// columns on genuinely narrower windows, matching the reference's visual
// intent (4-across on a normal desktop) rather than its literal number.
const GRID_CLASS = "grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] md:gap-5";

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
