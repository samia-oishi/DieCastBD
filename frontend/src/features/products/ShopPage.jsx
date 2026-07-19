import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { canonical } from "@/lib/siteUrl";
import { cn } from "@/lib/utils";
import { Seo } from "@/components/shared/Seo";
import { Container } from "@/components/shared/Container";
import { Pagination } from "@/components/shared/Pagination";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/useDebounce";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useBrands } from "@/features/brands/api/useBrands";
import { useProducts } from "./api/useProducts";
import { useShopFilters } from "./hooks/useShopFilters";
import { FilterSidebar } from "./components/FilterSidebar";
import { SortDropdown } from "./components/SortDropdown";
import { ProductGrid } from "./components/ProductGrid";

const PAGE_SIZE = 24;

function SearchPill({ value, onChange, className }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-full border border-line bg-white px-[18px] py-3 text-faint transition-colors focus-within:border-brand", className)}>
      <Search className="size-4 shrink-0" strokeWidth={2} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search the collection…"
        className="w-full bg-transparent text-base text-ink placeholder:text-faint focus:outline-none md:text-sm"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="text-faint hover:text-ink">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-colors",
        active ? "bg-ink text-white" : "border border-line bg-white text-ink-soft"
      )}
    >
      {children}
    </button>
  );
}

export function ShopPage() {
  const { filters, updateFilters, setPage, clearFilters, activeFilterCount } = useShopFilters();
  const [searchInput, setSearchInput] = useState(filters.q ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { ref: toolbarRef, dragProps } = useDragScroll();
  const { data: brands } = useBrands();
  // Short debounce so results filter live as you type (not only after a long
  // pause) while still coalescing rapid keystrokes into one request.
  const debouncedSearch = useDebounce(searchInput, 200);

  // Keep the URL's ?q= in sync with the settled search — shareable/bookmarkable,
  // without rewriting the URL on every keystroke.
  useEffect(() => {
    if ((filters.q ?? "") !== (debouncedSearch || "")) {
      updateFilters({ q: debouncedSearch || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data, isLoading, isPlaceholderData } = useProducts({
    ...filters,
    q: debouncedSearch || undefined,
    limit: PAGE_SIZE,
    page: filters.page,
  });

  const products = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (filters.page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(filters.page * PAGE_SIZE, total);
  const showing = total > 0 ? `Showing ${rangeStart}–${rangeEnd} of ${total}` : null;

  // Input just drives local state; the debounce effect above feeds the query + URL.
  const onSearch = setSearchInput;

  const sidebarProps = { filters, updateFilters, clearFilters, activeFilterCount };

  return (
    <>
      <Seo
        title="Shop Hot Wheels & MINI GT Diecast Cars in Bangladesh"
        description="Browse authentic Hot Wheels Premium and MINI GT diecast cars in Bangladesh — Car Culture, F1, JDM and more. 1:64 scale, nationwide delivery, cash on delivery."
      >
        <link rel="canonical" href={canonical("/shop")} />
        <meta property="og:url" content={canonical("/shop")} />
      </Seo>

      {/* ---------- Mobile head + toolbar ---------- */}
      <div className="md:hidden">
        <div className="mx-4 mt-4">
          <div className="flex items-baseline justify-between">
            <h1 className="font-display text-[26px] font-extrabold tracking-[-0.01em] text-ink">Shop the shelf</h1>
            {total > 0 && <span className="text-xs font-medium text-faint">{total} pieces</span>}
          </div>
          <SearchPill value={searchInput} onChange={onSearch} className="mt-3.5" />
        </div>
        <div ref={toolbarRef} {...dragProps} className="flex gap-2 scroll-pl-4 overflow-x-auto px-4 pb-0.5 pt-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip active onClick={() => setSheetOpen(true)}>
            <SlidersHorizontal className="size-[13px]" strokeWidth={2} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Chip>
          <SortDropdown value={filters.sort} onChange={(sort) => updateFilters({ sort })} className="shrink-0 px-4 py-2.5 text-[12.5px]" />
          {brands?.map((b) => (
            <Chip key={b.slug} active={filters.brand === b.slug} onClick={() => updateFilters({ brand: filters.brand === b.slug ? undefined : b.slug })}>
              {b.name}
            </Chip>
          ))}
          <Chip active={!!filters.inStock} onClick={() => updateFilters({ inStock: filters.inStock ? undefined : true })}>
            In stock
          </Chip>
        </div>
        <div className="mx-4 mt-4">
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : ""}>
            <ProductGrid products={products} isLoading={isLoading && !isPlaceholderData} />
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
            </div>
          )}
          {showing && <p className="mt-2.5 text-center text-[11.5px] text-faint">{showing}</p>}
        </div>
      </div>

      {/* ---------- Desktop head + body ---------- */}
      <div className="hidden md:block">
        <Container className="pt-9">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-[38px] font-extrabold tracking-[-0.02em] text-ink">Shop the shelf</h1>
              {total > 0 && <p className="mt-2 text-[14.5px] text-muted-foreground">{total} pieces in stock right now — every one hand-verified.</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SearchPill value={searchInput} onChange={onSearch} className="w-[340px]" />
              <SortDropdown value={filters.sort} onChange={(sort) => updateFilters({ sort })} prefix />
            </div>
          </div>
        </Container>

        <Container className="mt-7 grid grid-cols-[250px_1fr] items-start gap-9">
          <aside className="sticky top-[98px] rounded-[24px] border border-line bg-white p-6">
            <FilterSidebar {...sidebarProps} />
          </aside>
          <div>
            <div className={isPlaceholderData ? "opacity-60 transition-opacity" : ""}>
              <ProductGrid products={products} isLoading={isLoading && !isPlaceholderData} />
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="mt-10">
                <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
              </div>
            )}
            {showing && <p className="mt-3 text-center text-[12.5px] text-faint">{showing}</p>}
          </div>
        </Container>
      </div>

      {/* ---------- Mobile filter sheet ---------- */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[86%] max-w-sm overflow-y-auto bg-paper p-6">
          <SheetTitle className="sr-only">Filters</SheetTitle>
          <FilterSidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>
    </>
  );
}
