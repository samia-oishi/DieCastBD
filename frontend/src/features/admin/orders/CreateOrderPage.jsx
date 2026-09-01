import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, Search, Plus, Minus, X, UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { findDistrict } from "@/lib/bdGeo";
import { resolveZoneForDistrict } from "@/lib/shippingZone";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { SectionPanel } from "@/features/admin/shell/SectionPanel";
import { adminInputCls } from "@/features/admin/shell/adminFieldCls";
import { adminToast } from "@/features/admin/shell/adminToast";
import { DistrictThanaFields } from "@/features/addresses/components/DistrictThanaFields";
import { useAdminProducts } from "@/features/admin/products/api/useProducts";
import { useSettings } from "@/features/settings/api/useSettings";
import { useCustomerLookup, useCreateAdminOrderMutation } from "./api/useAdminOrders";

/** Takes an order the customer placed somewhere else — Facebook, Messenger, a
 * phone call — and puts it through exactly the same machinery as a website
 * order: real stock reservation, real cost snapshots, real revenue.
 *
 * Typing a phone number that has ordered before fills in the address it was
 * delivered to last time. That lookup lives here, admin-only, and deliberately
 * not in checkout: a public phone-to-address endpoint can't tell a returning
 * customer from a stranger typing numbers, so it would hand anyone the home
 * address behind any number they know.
 */
function Field({ label, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 text-[12.5px] font-semibold text-ink">
        {label} {hint && <span className="font-medium text-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function CreateOrderPage() {
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const createOrder = useCreateAdminOrderMutation();

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [note, setNote] = useState("");

  const [advance, setAdvance] = useState("");
  const [discount, setDiscount] = useState("");
  const [lines, setLines] = useState([]); // [{ product, qty }]
  const [search, setSearch] = useState("");
  const [autofilled, setAutofilled] = useState(null);

  const debouncedPhone = useDebounce(phone, 500);
  const { data: match } = useCustomerLookup(debouncedPhone);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const { data: productData } = useAdminProducts({ page: 1, limit: 20, q: debouncedSearch || undefined });

  // Memoised: `settings?.shippingZones ?? []` is a new array identity every
  // render, which would re-fire the default-zone effect endlessly.
  const zones = useMemo(() => settings?.shippingZones ?? [], [settings]);

  // Fill from the last order, once per match, and only into fields the admin
  // hasn't already typed into — retyping over their input would be worse than
  // not filling at all.
  useEffect(() => {
    if (!match?.customer || autofilled === match.customer.phone) return;
    setAutofilled(match.customer.phone);
    setName((v) => v || match.customer.name || "");
    setEmail((v) => v || match.customer.email || "");
    if (match.lastAddress) {
      setAddressLine1((v) => v || match.lastAddress.addressLine1 || "");
      setDistrict((v) => v || match.lastAddress.district || "");
      setThana((v) => v || match.lastAddress.thana || "");
    }
  }, [match, autofilled]);

  const setQty = (id, qty) =>
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.product._id !== id) : prev.map((l) => (l.product._id === id ? { ...l, qty } : l))));

  const addProduct = (product) => {
    setLines((prev) =>
      prev.some((l) => l.product._id === product._id)
        ? prev.map((l) => (l.product._id === product._id ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { product, qty: 1 }]
    );
    setSearch("");
  };

  const priceOf = (p) => (p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price);
  const subtotal = useMemo(() => lines.reduce((n, l) => n + priceOf(l.product) * l.qty, 0), [lines]);
  // The zone follows the district, exactly as it does at checkout — and the
  // server re-derives it from the address anyway, so offering the admin a
  // separate choice here would only let this preview disagree with the order
  // that actually gets written. findDistrict() first so an older spelling
  // pulled in by the phone lookup still resolves.
  const zoneData = district ? resolveZoneForDistrict(zones, findDistrict(district)?.name ?? district) : null;
  const zone = zoneData?.name ?? "";
  const shippingFee = zoneData?.fee ?? 0;
  const num = (v) => (v === "" ? 0 : Number(v));
  const total = Math.max(0, subtotal - num(discount)) + shippingFee;
  const due = Math.max(0, total - num(advance));

  const ready = name.trim() && phone.trim() && addressLine1.trim() && district && thana && zone && lines.length > 0;

  const submit = () => {
    createOrder.mutate(
      {
        // Pin to the customer the lookup found, so a returning buyer's order
        // history stays on one record instead of splitting onto a new one.
        customer: {
          id: match?.customer?.id ?? undefined,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        },
        shippingAddress: { recipientName: name.trim(), phone: phone.trim(), addressLine1: addressLine1.trim(), district, thana },
        items: lines.map((l) => ({ productId: l.product._id, qty: l.qty })),
        shippingZone: zone,
        deliveryNote: note.trim() || undefined,
        advanceReceived: num(advance) || undefined,
        discount: num(discount) || undefined,
        reason: num(advance) || num(discount) ? "Order taken outside the website" : undefined,
      },
      {
        onSuccess: (res) => {
          adminToast(res?.message ?? "Order created");
          navigate(`${ROUTES.ADMIN}/orders/${res.data._id}`);
        },
        onError: (err) => adminToast(err.response?.data?.message ?? "Could not create the order"),
      }
    );
  };

  return (
    <div className="flex flex-col gap-[18px] pb-10">
      <Link to={`${ROUTES.ADMIN}/orders`} className="flex w-fit items-center gap-1 text-[13px] font-semibold text-ink-soft hover:text-ink">
        <ChevronLeft size={17} strokeWidth={2.2} /> Back to orders
      </Link>
      <AdminPageHeader eyebrow="Facebook, Messenger or phone" title="Create an order" />

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-[18px]">
          <SectionPanel title="Customer" bodyClassName="pt-3">
            <div className="flex flex-col gap-4">
              <Field label="Phone" hint="— fills the address if they've ordered before">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className={adminInputCls} placeholder="01XXXXXXXXX" inputMode="numeric" />
                {match?.customer && (
                  <div className="mt-2 flex items-start gap-2 rounded-[10px] border border-brand-soft-border bg-brand-soft p-2.5 text-[12.5px] text-ink">
                    <UserCheck size={15} strokeWidth={2.2} className="mt-px shrink-0 text-brand-deep" />
                    <span>
                      <strong>{match.customer.name}</strong> — {match.orderCount} previous order{match.orderCount === 1 ? "" : "s"}. Address filled from the last one.
                    </span>
                  </div>
                )}
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} className={adminInputCls} /></Field>
                <Field label="Email" hint="(optional)"><Input value={email} onChange={(e) => setEmail(e.target.value)} className={adminInputCls} placeholder="they'll get a confirmation" /></Field>
              </div>
              <Field label="Address"><Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className={adminInputCls} placeholder="House, road, area" /></Field>
              <DistrictThanaFields
                district={district}
                thana={thana}
                onDistrictChange={setDistrict}
                onThanaChange={setThana}
                FieldWrapper={Field}
              />
              <Field label="Note for the rider" hint="(optional)">
                <Input value={note} onChange={(e) => setNote(e.target.value)} className={adminInputCls} placeholder="Landmark, preferred time…" />
              </Field>
            </div>
          </SectionPanel>

          <SectionPanel title="Products" bodyClassName="pt-3">
            <div className="relative">
              <Search size={15} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className={cn(adminInputCls, "pl-10")} placeholder="Search products to add…" />
            </div>
            {debouncedSearch && (
              <ul className="mt-2 max-h-[220px] overflow-y-auto rounded-[12px] border border-line">
                {(productData?.data ?? []).map((p) => (
                  <li key={p._id}>
                    <button type="button" onClick={() => addProduct(p)} className="flex w-full items-center justify-between gap-3 border-b border-line-soft px-3 py-2 text-left text-[13px] last:border-b-0 hover:bg-[#FCFCF9]">
                      <span className="min-w-0 truncate">{p.title}</span>
                      <span className="shrink-0 text-faint">{formatTaka(priceOf(p))} · {p.availableStock} left</span>
                    </button>
                  </li>
                ))}
                {!(productData?.data ?? []).length && <li className="px-3 py-3 text-[13px] text-faint">No products match.</li>}
              </ul>
            )}

            {lines.length === 0 ? (
              <p className="mt-3 text-[13px] text-faint">No products added yet.</p>
            ) : (
              <div className="mt-3 flex flex-col divide-y divide-line-soft">
                {lines.map(({ product, qty }) => (
                  <div key={product._id} className="flex items-center gap-3 py-2.5 text-[13px]">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-ink">{product.title}</div>
                      <div className="text-[12px] text-faint">{formatTaka(priceOf(product))} · {product.availableStock} in stock</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" aria-label="Decrease" onClick={() => setQty(product._id, qty - 1)} className="flex size-7 items-center justify-center rounded-full border border-line hover:border-ink"><Minus size={13} strokeWidth={2.4} /></button>
                      <span className="w-6 text-center font-semibold tabular-nums">{qty}</span>
                      <button type="button" aria-label="Increase" disabled={qty >= product.availableStock} onClick={() => setQty(product._id, qty + 1)} className="flex size-7 items-center justify-center rounded-full border border-line hover:border-ink disabled:opacity-40"><Plus size={13} strokeWidth={2.4} /></button>
                      <button type="button" aria-label="Remove" onClick={() => setQty(product._id, 0)} className="ml-1 text-faint hover:text-danger"><X size={15} strokeWidth={2.2} /></button>
                    </div>
                    <span className="w-20 shrink-0 text-right font-semibold text-ink">{formatTaka(priceOf(product) * qty)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        </div>

        <SectionPanel title="Delivery & payment" bodyClassName="pt-3">
          <div className="flex flex-col gap-4">
            <Field label="Delivery zone">
              {!zones.length ? (
                <p className="text-[12.5px] text-faint">No delivery zones configured — add them in Settings.</p>
              ) : !district ? (
                <p className="text-[12.5px] text-faint">Pick the district above to set the delivery charge.</p>
              ) : (
                <div className="flex items-center justify-between rounded-[12px] border border-line bg-[#FCFCF9] px-3.5 py-2.5 text-[13px]">
                  <span className="font-semibold text-ink">{zoneData?.name ?? "No charge"}</span>
                  <span className="text-ink-soft">{formatTaka(shippingFee)}</span>
                </div>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Advance received"><Input type="number" min="0" value={advance} onChange={(e) => setAdvance(e.target.value)} className={adminInputCls} placeholder="0" /></Field>
              <Field label="Discount"><Input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className={adminInputCls} placeholder="0" /></Field>
            </div>

            <div className="rounded-[12px] border border-line bg-[#FCFCF9] p-3.5 text-[13px]">
              <Row label="Subtotal" value={formatTaka(subtotal)} />
              {num(discount) > 0 && <Row label="Discount" value={`−${formatTaka(num(discount))}`} />}
              <Row label="Delivery" value={formatTaka(shippingFee)} />
              <Row label="Total" value={formatTaka(total)} strong />
              {num(advance) > 0 && <Row label="Advance received" value={`−${formatTaka(num(advance))}`} />}
              <div className="mt-1.5 flex items-baseline justify-between border-t border-line-soft pt-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-faint">Rider collects</span>
                <span className="font-display text-[19px] font-extrabold text-ink">{formatTaka(due)}</span>
              </div>
            </div>

            <p className="text-[11.5px] text-faint">
              Created as <strong className="text-ink-soft">Confirmed</strong> — stock is committed and it counts toward revenue straight away.
              {email.trim() ? " A confirmation email will be sent." : " No email will be sent."}
            </p>

            <AdminButton variant="primary" disabled={!ready || createOrder.isPending} onClick={submit}>
              {createOrder.isPending ? "Creating…" : "Create order"}
            </AdminButton>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={cn("flex justify-between", strong ? "mt-1 border-t border-line-soft pt-1.5 font-semibold text-ink" : "text-ink-soft")}>
      <span className={strong ? "" : "text-faint"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
