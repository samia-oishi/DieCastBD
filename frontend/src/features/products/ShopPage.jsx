import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { SlidersHorizontal, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts } from "./api/useProducts";
import { useShopFilters } from "./hooks/useShopFilters";
import { FilterSidebar } from "./components/FilterSidebar";
import { SortDropdown } from "./components/SortDropdown";
import { ProductGrid } from "./components/ProductGrid";

const PAGE_SIZE = 24;

export function ShopPage() {
  const { filters, updateFilters, setPage, clearFilters, activeFilterCount } = useShopFilters();
  const [searchInput, setSearchInput] = useState(filters.q ?? "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);

  const { data, isLoading, isPlaceholderData } = useProducts({
    ...filters,
    q: debouncedSearch || undefined,
    limit: PAGE_SIZE,
    page: filters.page,
  });

  const products = data?.data ?? [];
  const meta = data?.meta;

  const sidebarProps = { filters, updateFilters, clearFilters, activeFilterCount };

  return (
    <>
      <Helmet>
        <title>Shop — DiecastBD</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
        <h1 className="mb-6 font-heading text-3xl text-foreground">Shop</h1>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                updateFilters({ q: e.target.value || undefined });
              }}
              className="pl-8"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  updateFilters({ q: undefined });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="overflow-y-auto p-6">
              <SheetHeader className="px-0">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <FilterSidebar {...sidebarProps} />
              </div>
            </SheetContent>
          </Sheet>

          <SortDropdown value={filters.sort} onChange={(sort) => updateFilters({ sort })} />
        </div>

        <div className="flex gap-10">
          <aside className="hidden w-56 shrink-0 lg:block">
            <FilterSidebar {...sidebarProps} />
          </aside>

          <div className="flex-1">
            {meta && (
              <p className="mb-4 text-sm text-muted-foreground">
                {meta.total} product{meta.total !== 1 && "s"}
              </p>
            )}

            <div className={isPlaceholderData ? "opacity-60 transition-opacity" : ""}>
              <ProductGrid products={products} isLoading={isLoading && !isPlaceholderData} />
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="mt-10">
                <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
