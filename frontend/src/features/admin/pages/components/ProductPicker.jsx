import { useState } from "react";
import { Search, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAdminProducts } from "@/features/admin/products/api/useProducts";

/** Checkable product chips fed by the real catalogue.
 *
 * The search filters the fetched page client-side rather than re-querying: the
 * picker's job is "tick a few of your products", and a round trip per keystroke
 * would make that feel worse, not better.
 */
export function ProductPicker({ picked = [], onChange }) {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useAdminProducts({ page: 1, limit: 100 });

  const products = data?.data ?? [];
  const q = query.trim().toLowerCase();
  const visible = q
    ? products.filter((p) => p.name.toLowerCase().includes(q) || (p.slug ?? "").toLowerCase().includes(q))
    : products;

  const toggle = (slug) =>
    onChange(picked.includes(slug) ? picked.filter((s) => s !== slug) : [...picked, slug]);

  return (
    <div className="rounded-[12px] border border-line bg-white p-2.5">
      <div className="relative mb-2.5">
        <Search size={14} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="h-9 w-full rounded-[9px] border border-line bg-white pl-8 pr-3 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand focus:ring-[3px] focus:ring-[rgba(168,205,47,0.22)]"
        />
      </div>

      {isLoading && <p className="px-1 py-3 text-center text-[12px] text-faint">Loading products…</p>}
      {!isLoading && visible.length === 0 && (
        <p className="px-1 py-3 text-center text-[12px] text-faint">
          {q ? `No products match “${query}”` : "No products in the catalogue yet."}
        </p>
      )}

      <div className="flex max-h-[190px] flex-wrap gap-1.5 overflow-y-auto">
        {visible.map((p) => {
          const on = picked.includes(p.slug);
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => toggle(p.slug)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[12px] font-semibold transition-colors",
                on ? "border-brand bg-brand-glow text-ink" : "border-line bg-white text-ink-soft hover:bg-tile"
              )}
            >
              {on && <Check size={11} strokeWidth={3} />}
              {p.name}
            </button>
          );
        })}
      </div>

      <p className="mt-2 px-1 text-[11.5px] text-faint">
        {picked.length} selected
        {/* A picked product that later leaves the visible page still counts —
            the count reads the block, not what the search happens to show. */}
      </p>
    </div>
  );
}
