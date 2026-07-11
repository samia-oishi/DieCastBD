import { useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { useBrands } from "@/features/brands/api/useBrands";
import { useCategories } from "@/features/categories/api/useCategories";
import { useFilterOptions } from "../api/useProducts";

function FilterPill({ active, children, ...props }) {
  return (
    <button
      className={cn(
        "rounded-full px-3.5 py-2 text-[12.5px] font-semibold whitespace-nowrap transition-colors",
        active ? "bg-ink text-white" : "border border-border bg-card text-ink-soft hover:border-foreground"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function FilterPillGroup({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[11px] font-bold tracking-widest text-faint uppercase">{label}</span>
      <div className="flex flex-wrap gap-2">
        <FilterPill active={!value} onClick={() => onChange(undefined)}>
          All
        </FilterPill>
        {options.map((option) => (
          <FilterPill key={option.slug} active={value === option.slug} onClick={() => onChange(option.slug)}>
            {option.name}
          </FilterPill>
        ))}
      </div>
    </div>
  );
}

/** Sticky filter card — README §Screens: brand/category pill groups, series
 * select, price range slider, in-stock toggle, Clear all. Used as the
 * desktop sidebar (ShopPage) and, unstyled-wrapper, inside the mobile
 * filter Sheet — both share this one component so the controls can never
 * drift apart between breakpoints. */
export function FilterSidebar({ filters, updateFilters, clearFilters, activeFilterCount }) {
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const { data: filterOptions } = useFilterOptions();

  const bounds = [filterOptions?.minPrice ?? 0, filterOptions?.maxPrice ?? 5000];
  const [priceRange, setPriceRange] = useState(bounds);

  useEffect(() => {
    setPriceRange([
      filters.minPrice != null ? Number(filters.minPrice) : bounds[0],
      filters.maxPrice != null ? Number(filters.maxPrice) : bounds[1],
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.minPrice, filters.maxPrice, filterOptions]);

  return (
    <div className="flex flex-col gap-5.5">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[17px] font-bold text-foreground">Filters</span>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-[12.5px] font-semibold text-brand-deep">
            Clear all
          </button>
        )}
      </div>

      {brands?.length > 0 && (
        <FilterPillGroup label="Brand" options={brands} value={filters.brand} onChange={(brand) => updateFilters({ brand })} />
      )}

      {categories?.length > 0 && (
        <FilterPillGroup
          label="Category"
          options={categories}
          value={filters.category}
          onChange={(category) => updateFilters({ category })}
        />
      )}

      {filterOptions?.series?.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-bold tracking-widest text-faint uppercase">Series</span>
          <Select value={filters.series ?? "all"} onValueChange={(v) => updateFilters({ series: v === "all" ? undefined : v })}>
            <SelectTrigger className="h-auto w-full justify-between rounded-full border-border px-4 py-2.75 text-[13.5px] font-semibold text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All series</SelectItem>
              {filterOptions.series.map((series) => (
                <SelectItem key={series} value={series}>
                  {series}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filterOptions && bounds[1] > bounds[0] && (
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-bold tracking-widest text-faint uppercase">Price</span>
          <Slider
            min={bounds[0]}
            max={bounds[1]}
            step={50}
            value={priceRange}
            onValueChange={setPriceRange}
            onValueCommit={([min, max]) => updateFilters({ minPrice: min, maxPrice: max })}
          />
          <div className="flex justify-between text-[12.5px] font-semibold text-muted-2">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-line-soft pt-5">
        <span className="text-[13.5px] font-semibold text-foreground">In stock only</span>
        <Switch checked={!!filters.inStock} onCheckedChange={(checked) => updateFilters({ inStock: checked || undefined })} />
      </div>
    </div>
  );
}
