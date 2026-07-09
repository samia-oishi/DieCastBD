import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useBrands } from "@/features/brands/api/useBrands";
import { useCategories } from "@/features/categories/api/useCategories";
import { useFilterOptions } from "../api/useProducts";

function FilterPillGroup({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange(undefined)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            !value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
          )}
        >
          All
        </button>
        {options.map((option) => (
          <button
            key={option.slug}
            onClick={() => onChange(option.slug)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              value === option.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40"
            )}
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  );
}

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X /> Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {brands && (
        <FilterPillGroup
          label="Brand"
          options={brands}
          value={filters.brand}
          onChange={(brand) => updateFilters({ brand })}
        />
      )}

      {categories && (
        <FilterPillGroup
          label="Category"
          options={categories}
          value={filters.category}
          onChange={(category) => updateFilters({ category })}
        />
      )}

      {filterOptions?.series?.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Series</span>
          <Select
            value={filters.series ?? "all"}
            onValueChange={(v) => updateFilters({ series: v === "all" ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Series</SelectItem>
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
          <span className="text-sm font-medium text-foreground">Price</span>
          <Slider
            min={bounds[0]}
            max={bounds[1]}
            step={50}
            value={priceRange}
            onValueChange={setPriceRange}
            onValueCommit={([min, max]) => updateFilters({ minPrice: min, maxPrice: max })}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>৳{priceRange[0].toLocaleString()}</span>
            <span>৳{priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">In stock only</span>
        <Switch
          checked={!!filters.inStock}
          onCheckedChange={(checked) => updateFilters({ inStock: checked || undefined })}
        />
      </div>
    </div>
  );
}
