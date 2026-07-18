import { useState } from "react";
import { Link } from "react-router";
import { Plus, Trash2, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminSearch } from "@/features/admin/shell/AdminSearch";
import { FilterChips } from "@/features/admin/shell/FilterChips";
import { BulkBar } from "@/features/admin/shell/BulkBar";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { AdminThumb } from "@/features/admin/shell/AdminThumb";
import { adminToast } from "@/features/admin/shell/adminToast";
import { useAdminProducts, useBulkProductStatusMutation, useBulkDeleteProductsMutation } from "./api/useProducts";
import { effectivePrice } from "@/lib/pricing";

// Photo column sits right after the checkbox (merchant request — the design's
// prototype had no thumbnail, but scanning a catalogue by picture is faster).
const GRID = "md:grid-cols-[auto_44px_84px_1.9fr_1fr_1fr_1.05fr_66px_92px_24px]";
const CHECKBOX_CLS = "size-5 rounded-[6px] border-[1.5px] border-[#C9CBBE] data-[state=checked]:border-brand";

const STATUS_PILL = {
  active: "bg-brand-tint text-brand-deep",
  draft: "bg-[#FDF3E7] text-[#B45309]",
  archived: "bg-tile text-faint",
};

/** Effective selling price — mirrors the model's rule (a salePrice only counts
 * when it's a real discount below list), so the list can't show a bogus sale. */



export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  // Status chips hit the API; "Low stock" is a client-side lens over the page
  // (there's no backend low-stock filter on this endpoint).
  const statusParam = filter === "all" || filter === "lowStock" ? undefined : filter;

  const { data, isLoading } = useAdminProducts({
    page,
    limit: 10,
    status: statusParam,
    q: debouncedSearch || undefined,
  });
  const bulkStatus = useBulkProductStatusMutation();
  const bulkDelete = useBulkDeleteProductsMutation();

  const all = data?.data ?? [];
  const products = filter === "lowStock" ? all.filter((p) => (p.availableStock ?? p.stock) <= 2) : all;
  const meta = data?.meta;
  const selected = products.filter((p) => selectedIds.includes(p._id));

  const resetTo = (fn) => (value) => {
    fn(value);
    setPage(1);
    setSelectedIds([]);
  };

  const allOnPageSelected = products.length > 0 && products.every((p) => selectedIds.includes(p._id));
  const someOnPageSelected = products.some((p) => selectedIds.includes(p._id));
  const toggleAll = () => setSelectedIds(allOnPageSelected ? [] : products.map((p) => p._id));
  const toggleOne = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onSetStatus = (status) => {
    bulkStatus.mutate(
      { ids: selectedIds, status },
      {
        onSuccess: (res) => {
          adminToast(res?.message ?? `Products set to ${status}`);
          setSelectedIds([]);
        },
        onError: (err) => adminToast(err.response?.data?.message ?? "Could not update products"),
      }
    );
  };

  const onDelete = () => {
    bulkDelete.mutate(selectedIds, {
      onSuccess: (res) => {
        adminToast(res?.message ?? "Products deleted");
        setSelectedIds([]);
        setConfirmOpen(false);
      },
      onError: (err) => adminToast(err.response?.data?.message ?? "Could not delete products"),
    });
  };

  const chips = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "lowStock", label: "Low stock" },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      <AdminPageHeader
        eyebrow={meta ? `${meta.total} product${meta.total === 1 ? "" : "s"}` : "Catalogue"}
        title="Products"
        actions={
          <AdminButton asChild>
            <Link to="new">
              <Plus size={16} strokeWidth={2.4} /> Add product
            </Link>
          </AdminButton>
        }
      />

      <div className="flex flex-col gap-3">
        <AdminSearch
          value={search}
          onChange={(e) => resetTo(setSearch)(e.target.value)}
          placeholder="Search by title or SKU…"
          className="max-w-md"
        />
        <FilterChips chips={chips} value={filter} onChange={resetTo(setFilter)} />
      </div>

      <section className="overflow-x-auto rounded-[18px] border border-line bg-white">
        <div className="min-w-[940px]">
          <div className={cn("hidden items-center gap-4 border-b border-line-soft px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-faint md:grid", GRID)}>
            <Checkbox
              className={CHECKBOX_CLS}
              checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
              onCheckedChange={toggleAll}
              disabled={products.length === 0}
              aria-label="Select all products on this page"
            />
            <span>Photo</span>
            <span>SKU</span>
            <span>Product</span>
            <span>Brand</span>
            <span>Price</span>
            <span>Profit</span>
            <span>Stock</span>
            <span>Status</span>
            <span />
          </div>

          {isLoading && <p className="px-5 py-10 text-center text-[13.5px] text-faint">Loading…</p>}
          {!isLoading && products.length === 0 && (
            <p className="px-5 py-10 text-center text-[13.5px] text-faint">No products match — try a different search or filter.</p>
          )}

          {products.map((p) => {
            const isSel = selectedIds.includes(p._id);
            const price = effectivePrice(p);
            const onSale = price < p.price;
            const stock = p.availableStock ?? p.stock;
            const profit = p.costPrice != null ? price - p.costPrice : null;
            const margin = profit != null && price > 0 ? Math.round((profit / price) * 100) : null;

            return (
              <div
                key={p._id}
                className={cn(
                  "grid grid-cols-[auto_1fr] items-center gap-3 border-t border-line-soft px-4 py-2.5 transition-colors first:border-t-0 hover:bg-[#FCFCF9] md:gap-4 md:px-5",
                  GRID,
                  isSel && "bg-[#FBFDF3]"
                )}
              >
                <Checkbox
                  className={cn(CHECKBOX_CLS, "relative z-10")}
                  checked={isSel}
                  onCheckedChange={() => toggleOne(p._id)}
                  aria-label={`Select product ${p.title}`}
                />

                {/* desktop cells */}
                <div className="hidden md:contents">
                  <AdminThumb src={p.thumbnail?.url} alt={p.title} />
                  <span className="truncate font-display text-[11px] font-bold text-[#6B6E60]" title={p.sku}>{p.sku}</span>
                  <Link to={p._id} className="truncate text-[13px] text-ink hover:text-brand-deep" title={p.title}>
                    {p.title}
                  </Link>
                  <span className="truncate text-[12.5px] text-ink-soft">{p.brand?.name ?? "—"}</span>
                  <span className="truncate text-[12.5px]">
                    <span className="font-semibold text-ink">{formatTaka(price)}</span>
                    {onSale && <span className="ml-1.5 text-[11px] text-faint line-through">{formatTaka(p.price)}</span>}
                  </span>
                  <span className="truncate text-[12px]">
                    {profit != null ? (
                      <span className={profit > 0 ? "text-brand-deep" : "text-faint"}>
                        {formatTaka(profit)}
                        {margin != null && ` · ${margin}%`}
                      </span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </span>
                  <span className={cn("text-[12.5px] font-semibold", stock === 0 ? "text-danger" : stock <= 2 ? "text-warn" : "text-ink")}>
                    {stock}
                  </span>
                  <span>
                    <span className={cn("inline-block rounded-full px-2.5 py-[3px] text-[10.5px] font-bold capitalize", STATUS_PILL[p.status] ?? STATUS_PILL.archived)}>
                      {p.status}
                    </span>
                  </span>
                  <Link to={p._id} className="flex justify-end text-faint hover:text-ink">
                    <ChevronRight size={18} strokeWidth={2} />
                  </Link>
                </div>

                {/* mobile card */}
                <Link to={p._id} className="flex items-center gap-3 md:hidden">
                  <AdminThumb src={p.thumbnail?.url} alt={p.title} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-ink">{p.title}</div>
                    <div className="truncate text-[11.5px] text-faint">
                      {p.sku} · {p.brand?.name ?? "—"}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[13px] font-bold text-ink">{formatTaka(price)}</span>
                    <span className={cn("text-[11.5px] font-semibold", stock === 0 ? "text-danger" : stock <= 2 ? "text-warn" : "text-faint")}>
                      {stock} in stock
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-faint">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(p) => {
              setPage(p);
              setSelectedIds([]);
            }}
          />
        </div>
      )}

      <BulkBar count={selectedIds.length}>
        <AdminButton variant="glass" size="sm" onClick={() => onSetStatus("active")} disabled={bulkStatus.isPending}>
          Set active
        </AdminButton>
        <AdminButton variant="glass" size="sm" onClick={() => onSetStatus("draft")} disabled={bulkStatus.isPending}>
          Set draft
        </AdminButton>
        <AdminButton variant="glass" size="sm" onClick={() => setSelectedIds([])}>
          Clear
        </AdminButton>
        <AdminButton variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
          <Trash2 size={15} strokeWidth={2.2} /> Delete
        </AdminButton>
      </BulkBar>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.length} product{selectedIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                  {selected.map((p) => (
                    <div key={p._id} className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-xs last:border-b-0">
                      <span className="truncate">{p.title}</span>
                      <span className="shrink-0 font-mono text-[11px]">{p.sku}</span>
                    </div>
                  ))}
                </div>
                <p>
                  They&apos;ll disappear from the storefront and these lists. Past orders keep their own copy of each
                  item, so order history is unaffected.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDelete.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={bulkDelete.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {bulkDelete.isPending ? "Deleting…" : `Delete ${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
