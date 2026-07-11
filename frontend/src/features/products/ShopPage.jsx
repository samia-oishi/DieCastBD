import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { canonical } from "@/lib/siteUrl";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Container } from "@/components/shared/Container";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useBrands } from "@/features/brands/api/useBrands";
import { useProducts } from "./api/useProducts";
import { useShopFilters } from "./hooks/useShopFilters";
import { FilterSidebar } from "./components/FilterSidebar";
import { SortDropdown } from "./components/SortDropdown";
import { ProductGrid } from "./components/ProductGrid";
import { ShopPagination } from "./components/ShopPagination";

const PAGE_SIZE = 24;

function SearchField({ value, onChange, className }) {
  return (
    <div className={`relative flex flex-1 items-center gap-2.5 rounded-full border border-border bg-card text-faint ${className ?? ""}`}>
      <Search className="pointer-events-none absolute left-4.5 size-4" />
      <input
        placeholder="Search the collection…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full w-full bg-transparent py-3 pr-9 pl-11 text-sm text-foreground placeholder:text-faint focus:outline-none md:py-3.5 md:pl-11.5 md:text-[14px]"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-4 text-faint hover:text-foreground" aria-label="Clear search">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

function MobileChip({ active, children, ...props }) {
  return (
    <button
      className={
        active
          ? "flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[12.5px] font-semibold text-white"
          : "flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-[12.5px] font-semibold text-ink-soft"
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function ShopPage() {
  const { filters, updateFilters, setPage, clearFilters, activeFilterCount } = useShopFilters();
  const [searchInput, setSearchInput] = useState(filters.q ?? "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { data: brands } = useBrands();
  const chipRowRef = useDragScroll();

  // Real-time search — query on every keystroke, no debounce. The catalog
  // is small enough (~30 SKUs) that this is trivially fast, and instant
  // feedback was an explicit request over the usual "debounce to avoid
  // hammering the API" default.
  const { data, isLoading, isPlaceholderData } = useProducts({
    ...filters,
    q: searchInput || undefined,
    limit: PAGE_SIZE,
    page: filters.page,
  });

  const products = data?.data ?? [];
  const meta = data?.meta;

  const sidebarProps = { filters, updateFilters, clearFilters, activeFilterCount };

  const onSearchChange = (v) => {
    setSearchInput(v);
    updateFilters({ q: v || undefined });
  };

  const rangeStart = meta ? (meta.page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.page * PAGE_SIZE, meta.total) : 0;

  return (
    <>
      <Helmet>
        <title>Shop Hot Wheels &amp; MINI GT Diecast Cars in Bangladesh | DiecastBD</title>
        <meta
          name="description"
          content="Browse authentic Hot Wheels Premium and MINI GT diecast cars in Bangladesh — Car Culture, F1, JDM and more. 1:64 scale, nationwide delivery, cash on delivery."
        />
        {/* Canonical points at the clean /shop URL so filtered/paginated views don't
            fragment ranking signals across many near-duplicate query-string URLs. */}
        <link rel="canonical" href={canonical("/shop")} />
      </Helmet>

      {/* Desktop page head */}
      <Container className="hidden pt-9 md:block">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-[38px] font-extrabold tracking-[-0.02em] text-foreground">Shop the shelf</h1>
            <p className="mt-2 text-[14.5px] text-muted-2">
              {meta ? `${meta.total} pieces in stock right now` : "Loading the collection"} — every one hand-verified.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SearchField value={searchInput} onChange={onSearchChange} className="w-85" />
            <SortDropdown value={filters.sort} onChange={(sort) => updateFilters({ sort })} />
          </div>
        </div>
      </Container>

      {/* Mobile page head + toolbar */}
      <div className="mt-4 px-4 md:hidden">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl font-extrabold tracking-[-0.01em] text-foreground">Shop the shelf</span>
          {meta && <span className="text-xs font-medium text-faint">{meta.total} pieces</span>}
        </div>
        <SearchField value={searchInput} onChange={onSearchChange} className="mt-3.5 h-11.5" />
      </div>
      <div ref={chipRowRef} className="scrollbar-none mt-3.5 flex cursor-grab gap-2 overflow-x-auto px-4 pb-0.5 select-none md:hidden">
        <MobileChip active onClick={() => setMobileFiltersOpen(true)}>
          <SlidersHorizontal className="size-3.25" />
          Filters
        </MobileChip>
        <SortDropdown value={filters.sort} onChange={(sort) => updateFilters({ sort })} className="shrink-0 px-4 py-2.5 text-[12.5px]" />
        {brands?.map((brand) => (
          <MobileChip
            key={brand.slug}
            active={filters.brand === brand.slug}
            onClick={() => updateFilters({ brand: filters.brand === brand.slug ? undefined : brand.slug })}
          >
            {brand.name}
          </MobileChip>
        ))}
        <MobileChip active={!!filters.inStock} onClick={() => updateFilters({ inStock: !filters.inStock || undefined })}>
          In stock
        </MobileChip>
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="overflow-y-auto p-6">
          {/* FilterSidebar renders its own visible "Filters" heading — this
              one is for the Sheet's aria-labelledby only, not shown twice. */}
          <SheetHeader className="sr-only">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <FilterSidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>

      <Container className="mt-7 pb-16 md:mt-6.5">
        <div className="flex gap-9">
          <aside className="hidden w-62.5 shrink-0 md:block">
            <div className="sticky top-24.5 rounded-3xl border border-border bg-card p-6">
              <FilterSidebar {...sidebarProps} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className={isPlaceholderData ? "opacity-60 transition-opacity" : ""}>
              <ProductGrid products={products} isLoading={isLoading && !isPlaceholderData} />
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="mt-10">
                <ShopPagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
                <p className="mt-3 text-center text-[12.5px] text-faint">
                  Showing {rangeStart}–{rangeEnd} of {meta.total}
                </p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
