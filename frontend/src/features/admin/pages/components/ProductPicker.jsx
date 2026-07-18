import { useState } from "react";
import { Search, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { AdminThumb } from "@/features/admin/shell/AdminThumb";
import { useAdminProducts } from "@/features/admin/products/api/useProducts";

/** Checkable product rows fed by the real catalogue.
 *
 * Products are keyed and stored by `slug`, so a title edit never breaks a block.
 * Note the field is `title`, not `name` — the design prototype called it `name`
 * and copying that verbatim gave blank chips and a search that threw on the
 * first keystroke.
 *
 * Search goes to the server (debounced). Filtering the fetched page instead
 * would work today at 32 products, but the fetch is capped at 100 — so the
 * moment the catalogue outgrows that, searching would silently fail to find
 * products that exist.
 */
export function ProductPicker({ picked = [], onChange }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 300);
  const { data, isLoading } = useAdminProducts({ page: 1, limit: 100, q: debouncedQuery || undefined });

  const visible = data?.data ?? [];
  const total = data?.meta?.total ?? visible.length;
  const q = debouncedQuery.toLowerCase();

  const toggle = (slug) =>
    onChange(picked.includes(slug) ? picked.filter((s) => s !== slug) : [...picked, slug]);

  return (
    <div className="rounded-[12px] border border-line bg-white p-2.5">
      <div className="relative mb-2.5">
        <Search size={14} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or SKU…"
          className="h-9 w-full rounded-[9px] border border-line bg-white pl-8 pr-3 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-[3px] focus:ring-[rgba(168,205,47,0.22)]"
        />
      </div>

      {isLoading && <p className="px-1 py-3 text-center text-[12px] text-faint">Loading products…</p>}
      {!isLoading && visible.length === 0 && (
        <p className="px-1 py-3 text-center text-[12px] text-faint">
          {q ? `No products match “${query}”` : "No products in the catalogue yet."}
        </p>
      )}

      {visible.length > 0 && (
        <div className="flex max-h-[260px] flex-col gap-1 overflow-y-auto">
          {visible.map((p) => {
            const on = picked.includes(p.slug);
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => toggle(p.slug)}
                aria-pressed={on}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] border px-2 py-1.5 text-left transition-colors",
                  on ? "border-brand bg-brand-glow" : "border-transparent hover:bg-tile"
                )}
              >
                <span
                  className={cn(
                    "flex size-[18px] shrink-0 items-center justify-center rounded-[6px] border",
                    on ? "border-brand-deep bg-brand-deep text-white" : "border-line bg-white"
                  )}
                >
                  {on && <Check size={11} strokeWidth={3} />}
                </span>
                <AdminThumb src={p.thumbnail?.url} alt={p.title} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-ink">{p.title}</span>
                  {p.sku && <span className="block truncate text-[11px] text-faint">{p.sku}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Counts the block's own list, so products picked earlier still count
          even when the current search hides them. */}
      <p className="mt-2 px-1 text-[11.5px] text-faint">
        {picked.length} selected
        {q && visible.length > 0 && ` · ${total} match${total === 1 ? "" : "es"}`}
        {!q && total > visible.length && ` · showing first ${visible.length} of ${total} — search to narrow`}
      </p>
    </div>
  );
}
