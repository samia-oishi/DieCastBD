import { useState, useEffect, useMemo, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { canonical } from "@/lib/siteUrl";
import { cn } from "@/lib/utils";
import { Seo } from "@/components/shared/Seo";
import { Container } from "@/components/shared/Container";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/useDebounce";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useBrands } from "@/features/brands/api/useBrands";
import { useInfiniteProducts } from "./api/useProducts";
import { useShopFilters } from "./hooks/useShopFilters";
import { FilterSidebar } from "./components/FilterSidebar";
import { SortDropdown } from "./components/SortDropdown";
import { ProductGrid } from "./components/ProductGrid";

const PAGE_SIZE = 24;

// Scrolling auto-loads this many pages, then a tap is required. Pure infinite
// scroll makes the footer — which carries the internal links to the /brand and
// /category landing pages — practically unreachable. A manual tap resets the
// budget, so the rhythm is auto, auto, tap, auto, auto.
const AUTO_LOAD_LIMIT = 2;

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
  const { filters, updateFilters, clearFilters, activeFilterCount } = useShopFilters();
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

  // No `page` here on purpose — it enters only as useInfiniteQuery's pageParam.
  const queryParams = { ...filters, q: debouncedSearch || undefined, limit: PAGE_SIZE };
  const { data, isLoading, isPlaceholderData, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteProducts(queryParams);

  // De-duped flatten. Offset pagination can repeat an item if the catalogue
  // shifts mid-scroll; rendering it twice would also trip a duplicate-key
  // warning. (The backend's _id sort tie-breaker removes the deterministic
  // case; this covers the live-inventory one.)
  const products = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const page of data?.pages ?? []) {
      for (const product of page?.data ?? []) {
        if (seen.has(product._id)) continue;
        seen.add(product._id);
        out.push(product);
      }
    }
    return out;
  }, [data]);

  const meta = data?.pages?.at(-1)?.meta; // freshest total
  const total = meta?.total ?? 0;
  const showing =
    total > 0
      ? products.length >= total
        ? `All ${total} pieces`
        : `Showing ${products.length} of ${total}`
      : null;

  // Auto-load budget, reset whenever the result set changes identity. Tracked
  // in BOTH a ref and state on purpose: the ref is the guard (it updates
  // synchronously, so two intersections arriving before React re-renders can't
  // both slip past a stale count), while the state drives `enabled` so the
  // observer actually disconnects once the budget is spent.
  const autoLoadsRef = useRef(0);
  const [autoLoads, setAutoLoads] = useState(0);
  const paramsKey = JSON.stringify(queryParams);
  const resultsRef = useRef(null);
  const firstParamsRef = useRef(paramsKey);

  useEffect(() => {
    autoLoadsRef.current = 0;
    setAutoLoads(0);
  }, [paramsKey]);

  // A filter change collapses a long list to one page, and the browser clamps
  // the scroll to the bottom of the now-short page. Pull the results back into
  // view — but only if the user had actually scrolled past them, so tapping a
  // chip while already at the top doesn't yank the page.
  useEffect(() => {
    if (firstParamsRef.current === paramsKey) return; // skip mount
    firstParamsRef.current = paramsKey;
    const top = resultsRef.current?.offsetTop ?? 0;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  }, [paramsKey]);

  const loadMore = (auto) => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (auto) {
      if (autoLoadsRef.current >= AUTO_LOAD_LIMIT) return;
      autoLoadsRef.current += 1;
    } else {
      autoLoadsRef.current = 0; // a manual tap re-arms auto-loading
    }
    setAutoLoads(autoLoadsRef.current);
    fetchNextPage();
  };

  // `enabled` disconnects the observer entirely while a fetch is in flight,
  // rather than firing and ignoring — that's what stops a fast scroll from
  // queueing duplicate loads. The isPlaceholderData term matters too: during a
  // filter change, hasNextPage still describes the PREVIOUS result set.
  const sentinelRef = useIntersectionObserver({
    onIntersect: () => loadMore(true),
    enabled: hasNextPage && !isFetchingNextPage && !isPlaceholderData && autoLoads < AUTO_LOAD_LIMIT,
    rootMargin: "400px", // start fetching before the user hits the very end
  });

  // Input just drives local state; the debounce effect above feeds the query + URL.
  const onSearch = setSearchInput;

  const sidebarProps = { filters, updateFilters, clearFilters, activeFilterCount };

  // A view filtered to exactly one brand or category IS the collection landing
  // page, so it canonicalises there — that's the URL built to rank, and it
  // inherits the signal from links pointing at the query form (merchant nav,
  // anything already indexed). Any other combination stays /shop: multi-facet
  // and searched views are app state, not pages worth indexing separately.
  const onlyFacet = (key) => {
    const others = ["brand", "category", "series", "minPrice", "maxPrice", "q"].filter((k) => k !== key);
    return filters[key] && !others.some((k) => filters[k]) && !filters.inStock && !filters.featured && !filters.newArrival;
  };
  const canonicalPath = onlyFacet("brand")
    ? `/brand/${filters.brand}`
    : onlyFacet("category")
      ? `/category/${filters.category}`
      : "/shop";

  return (
    <>
      <Seo
        title="Shop Hot Wheels & MINI GT Diecast Cars in Bangladesh"
        description="Browse authentic Hot Wheels Premium and MINI GT diecast cars in Bangladesh — Car Culture, F1, JDM and more. 1:64 scale, nationwide delivery, cash on delivery."
      >
        <link rel="canonical" href={canonical(canonicalPath)} />
        <meta property="og:url" content={canonical(canonicalPath)} />
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

      </div>

      {/* ---------- Results: ONE region for both breakpoints ----------
          The grid used to be rendered twice (a md:hidden tree and a
          hidden md:block tree), so every product mounted a duplicate
          ProductCard — each carrying its own wishlist query observer and
          restock-store subscription — with half of them permanently
          invisible. Bounded at 24 products; unbounded once the list grows by
          scrolling. The heads stay duplicated above because they're genuinely
          different markup; only the results are shared.
          Container's mobile gutter (px-4) matches the old mx-4 exactly. */}
      <Container className="mt-4 md:mt-7 md:grid md:grid-cols-[250px_1fr] md:items-start md:gap-9">
        <aside className="sticky top-[98px] hidden rounded-[24px] border border-line bg-white p-6 md:block">
          <FilterSidebar {...sidebarProps} />
        </aside>
        <div ref={resultsRef}>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : ""}>
            <ProductGrid
              products={products}
              isLoading={isLoading && !isPlaceholderData}
              appendingCount={isFetchingNextPage ? Math.min(PAGE_SIZE, Math.max(0, total - products.length)) : 0}
            />
          </div>

          {/* Sentinel sits above the button so it enters the viewport first. */}
          {hasNextPage && <div ref={sentinelRef} aria-hidden className="h-px" />}

          {hasNextPage && (
            <div className="mt-8 flex justify-center md:mt-10">
              <button
                type="button"
                onClick={() => loadMore(false)}
                disabled={isFetchingNextPage}
                className="inline-flex h-11 items-center rounded-full bg-ink px-6 font-display text-[13.5px] font-bold text-white transition-colors hover:bg-[#26301A] disabled:opacity-60"
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            </div>
          )}

          {/* Auto-appended results are silent to screen readers without this. */}
          {showing && (
            <p aria-live="polite" className="mt-2.5 text-center text-[11.5px] text-faint md:mt-3 md:text-[12.5px]">
              {showing}
            </p>
          )}
        </div>
      </Container>

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
