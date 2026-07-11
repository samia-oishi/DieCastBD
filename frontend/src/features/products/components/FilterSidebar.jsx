import { useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { useBrands } from "@/features/brands/api/useBrands";
import { useCategories } from "@/features/categories/api/useCategories";
import { useFilterOptions } from "../api/useProducts";

function GroupLabel({ children, className }) {
  return <div className={cn("text-[11px] font-bold uppercase tracking-[0.1em] text-faint", className)}>{children}</div>;
}

function Pill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
        active ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-ink"
      )}
    >
      {children}
    </button>
  );
}

function PillGroup({ label, options, value, onChange }) {
  return (
    <div>
      <GroupLabel className="mb-2.5 mt-[22px]">{label}</GroupLabel>
      <div className="flex flex-wrap gap-2">
        <Pill active={!value} onClick={() => onChange(undefined)}>All</Pill>
        {options.map((o) => (
          <Pill key={o.slug} active={value === o.slug} onClick={() => onChange(o.slug)}>
            {o.name}
          </Pill>
        ))}
      </div>
    </div>
  );
}

/** Filter controls (no card wrapper — the desktop sidebar and the mobile sheet
 * supply their own container). Matches DiecastBD Shop.dc.html. */
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
    <div>
      <div className="flex items-baseline justify-between">
        <div className="font-display text-[17px] font-bold text-ink">Filters</div>
        {activeFilterCount > 0 && (
          <button type="button" onClick={clearFilters} className="text-[12.5px] font-semibold text-brand-deep">
            Clear all
          </button>
        )}
      </div>

      {brands && (
        <PillGroup label="Brand" options={brands} value={filters.brand} onChange={(brand) => updateFilters({ brand })} />
      )}

      {categories && (
        <PillGroup label="Category" options={categories} value={filters.category} onChange={(category) => updateFilters({ category })} />
      )}

      {filterOptions?.series?.length > 0 && (
        <div>
          <GroupLabel className="mb-2.5 mt-[22px]">Series</GroupLabel>
          <Select value={filters.series ?? "all"} onValueChange={(v) => updateFilters({ series: v === "all" ? undefined : v })}>
            <SelectTrigger className="h-auto w-full rounded-full border-line px-4 py-[11px] text-[13.5px] font-semibold text-ink">
              <SelectValue placeholder="All series" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All series</SelectItem>
              {filterOptions.series.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filterOptions && bounds[1] > bounds[0] && (
        <div>
          <GroupLabel className="mb-3.5 mt-6">Price</GroupLabel>
          <Slider
            min={bounds[0]}
            max={bounds[1]}
            step={50}
            value={priceRange}
            onValueChange={setPriceRange}
            onValueCommit={([min, max]) => updateFilters({ minPrice: min, maxPrice: max })}
            className="mx-2"
          />
          <div className="mt-2.5 flex justify-between text-[12.5px] font-semibold text-muted-foreground">
            <span>{formatTaka(priceRange[0])}</span>
            <span>{formatTaka(priceRange[1])}</span>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-5">
        <span className="text-[13.5px] font-semibold text-ink">In stock only</span>
        <Switch checked={!!filters.inStock} onCheckedChange={(checked) => updateFilters({ inStock: checked || undefined })} />
      </div>
    </div>
  );
}
