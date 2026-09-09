import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { adminInputCls } from "@/features/admin/shell/adminFieldCls";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { useAdminProducts } from "@/features/admin/products/api/useProducts";

const priceOf = (p) =>
  p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;

/** Adds products to an order that already exists — the customer who messages
 * after ordering and wants another model on the same parcel, rather than
 * placing a second order that ships separately.
 *
 * Mirrors the product picker on the admin create-order page so the two feel
 * like one tool. The live "collect on delivery" figure is the point of the
 * preview: adding a product changes what a rider collects at someone's door,
 * and the merchant should see that number before committing, not after.
 */
export function AddItemsDialog({
  order,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}) {
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState([]); // [{ product, qty }]

  const debouncedSearch = useDebounce(search.trim(), 300);
  const { data: productData } = useAdminProducts({
    page: 1,
    limit: 20,
    q: debouncedSearch || undefined,
  });

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setLines([]);
  }, [open]);

  const addProduct = (product) =>
    setLines((prev) =>
      prev.some((l) => l.product._id === product._id)
        ? prev.map((l) =>
            l.product._id === product._id
              ? { ...l, qty: Math.min(l.qty + 1, product.availableStock) }
              : l,
          )
        : [...prev, { product, qty: 1 }],
    );

  const setQty = (id, qty) =>
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.product._id !== id)
        : prev.map((l) => (l.product._id === id ? { ...l, qty } : l)),
    );

  const added = useMemo(
    () => lines.reduce((n, l) => n + priceOf(l.product) * l.qty, 0),
    [lines],
  );

  if (!order) return null;

  const nextSubtotal = (order.subtotal ?? 0) + added;
  const nextTotal =
    nextSubtotal - (order.discount ?? 0) + (order.shippingFee ?? 0);
  const nextDue = nextTotal - (order.amountPaid ?? 0);

  // Steadfast has no endpoint to update a parcel after it is created, so the
  // backend refuses outright rather than letting the rider collect the old COD.
  const lockedByCourier =
    Boolean(order.courier?.consignmentId) &&
    !["delivered", "partial_delivered", "cancelled"].includes(
      order.courier?.status,
    );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Add products · ${order.orderNumber}`}
    >
      <div className="flex flex-col gap-4">
        {/* Everything above the buttons scrolls as one block, capped against the
            viewport. Without this the picker plus a few chosen products grew
            taller than a phone screen and pushed "Add to order" off the bottom
            of the sheet — the merchant could pick items and not reach the
            button. The actions sit outside it, so they are always in reach. */}
        <div className="flex max-h-[52vh] flex-col gap-4 overflow-y-auto overscroll-contain md:max-h-none md:overflow-visible">
          {lockedByCourier && (
            <div className="flex gap-2.5 rounded-[12px] border border-[#F0D9B5] bg-[#FDF8EF] p-3 text-[12.5px] text-[#8A5A12]">
              <TriangleAlert
                size={16}
                strokeWidth={2.2}
                className="mt-px shrink-0"
              />
              <span>
                Parcel {order.courier.consignmentId} is already with Steadfast,
                and their API cannot change a booked parcel's COD amount. Cancel
                it in their panel first, or send the extra item as a separate
                parcel.
              </span>
            </div>
          )}

          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(adminInputCls, "pl-10")}
              placeholder="Search products to add…"
              disabled={lockedByCourier}
            />
          </div>

          {!lockedByCourier && (
            <ul
              className={cn(
                "overflow-y-auto overscroll-contain rounded-[12px] border border-line-soft",
                // Sized off the viewport on a phone so the list never pushes the
                // search field or the buttons off the sheet.
                "max-h-[30vh] md:max-h-[240px]",
                // The list scrolls, so its last visible row is always sliced. The
                // fade says "there is more below" instead of leaving what looks
                // like a rendering fault at the edge.
                "[mask-image:linear-gradient(to_bottom,black_calc(100%-22px),transparent)]",
              )}
            >
              {(productData?.data ?? []).map((p) => (
                <li key={p._id}>
                  <button
                    type="button"
                    disabled={p.availableStock < 1}
                    onClick={() => addProduct(p)}
                    className="flex w-full items-center justify-between gap-3 border-b border-line-soft px-3 py-2 text-left text-[13px] last:border-b-0 hover:bg-[#FCFCF9] disabled:opacity-40"
                  >
                    <span className="min-w-0 truncate text-ink">{p.title}</span>
                    <span className="shrink-0 whitespace-nowrap text-[12px] text-faint">
                      {formatTaka(priceOf(p))} · {p.availableStock} left
                    </span>
                  </button>
                </li>
              ))}
              {!(productData?.data ?? []).length && (
                <li className="px-3 py-3 text-[13px] text-faint">
                  No products match.
                </li>
              )}
            </ul>
          )}

          {lines.length > 0 && (
            <div className="flex flex-col divide-y divide-line-soft border-t border-line-soft pt-1">
              {lines.map(({ product, qty }) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 py-2.5 text-[13px]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-ink">{product.title}</div>
                    <div className="text-[12px] text-faint">
                      {formatTaka(priceOf(product))} · {product.availableStock}{" "}
                      in stock
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() => setQty(product._id, qty - 1)}
                      className="flex size-7 items-center justify-center rounded-full border border-line hover:border-ink"
                    >
                      <Minus size={13} strokeWidth={2.4} />
                    </button>
                    <span className="w-6 text-center font-semibold text-ink">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase"
                      disabled={qty >= product.availableStock}
                      onClick={() => setQty(product._id, qty + 1)}
                      className="flex size-7 items-center justify-center rounded-full border border-line hover:border-ink disabled:opacity-40"
                    >
                      <Plus size={13} strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => setQty(product._id, 0)}
                      className="ml-1 text-faint hover:text-danger"
                    >
                      <X size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                  <span className="w-20 shrink-0 text-right font-semibold text-ink">
                    {formatTaka(priceOf(product) * qty)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {added > 0 && (
            <div className="flex flex-col gap-1 rounded-[12px] bg-[#FCFCF9] p-3.5 text-[13px]">
              <Row label="Adding" value={`+${formatTaka(added)}`} />
              <Row label="New subtotal" value={formatTaka(nextSubtotal)} />
              <Row label="New total" value={formatTaka(nextTotal)} />
              <div className="mt-1 flex justify-between border-t border-line-soft pt-2 font-display text-[14.5px] font-extrabold text-ink">
                <span>Collect on delivery</span>
                <span>{formatTaka(nextDue)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5">
          <AdminButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </AdminButton>
          <AdminButton
            disabled={added <= 0 || isPending || lockedByCourier}
            onClick={() =>
              onSubmit(
                lines.map((l) => ({ productId: l.product._id, qty: l.qty })),
              )
            }
          >
            {isPending ? "Adding…" : "Add to order"}
          </AdminButton>
        </div>
      </div>
    </ResponsiveModal>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#6B6E60]">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
