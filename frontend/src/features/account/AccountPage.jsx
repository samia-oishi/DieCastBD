import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ChevronRight, Heart, Package, MapPin, User, LogOut } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { formatAddressLine } from "@/lib/address";
import { ROUTES } from "@/constants/routes";
import { Seo } from "@/components/shared/Seo";
import { StatusChip } from "@/components/shared/StatusChip";
import { ResponsiveModal } from "@/components/shared/ResponsiveModal";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useCurrentUser, useLogoutMutation } from "@/features/auth/api/useAuth";
import { useUpdateProfileMutation, useDeactivateAccountMutation } from "./api/useAccount";
import { updateProfileSchema } from "./schemas/accountSchemas";
import { useMyOrders } from "@/features/orders/api/useOrders";
import { useWishlist } from "@/features/wishlist/api/useWishlist";
import { useAddresses, useCreateAddressMutation, useUpdateAddressMutation } from "@/features/addresses/api/useAddresses";
import { AddressForm } from "@/features/addresses/components/AddressForm";

const inputCls =
  "w-full rounded-[12px] border border-line bg-paper px-4 py-[13px] text-base leading-[1.2] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:text-[13.5px]";

const PAYMENT_LABELS = { cod: "Cash on Delivery", bkash: "bKash", banglaqr: "BanglaQR" };
const LABEL = "text-[11px] font-bold uppercase tracking-[0.12em] text-faint";
const CARD = "rounded-[20px] border border-line bg-white p-[22px]";
const LINK_ARROW = "mt-3.5 flex items-center gap-1.5 text-[13px] font-bold text-brand-deep";

function initials(name) {
  return (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function monthYear(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/* ---------- edit dialogs ---------- */

function EditProfileDialog({ open, onOpenChange, user }) {
  const mutation = useUpdateProfileMutation();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(updateProfileSchema),
    values: { name: user?.name ?? "", phone: user?.phone ?? "" },
  });
  const onSubmit = (values) =>
    mutation.mutate(values, {
      onSuccess: () => { toast.success("Profile updated"); onOpenChange(false); },
      onError: () => toast.error("Could not update profile"),
    });

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Account details">
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-[7px] text-[12.5px] font-semibold text-ink">Full name</div>
          <input {...register("name")} className={inputCls} />
          {errors.name && <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <div className="mb-[7px] text-[12.5px] font-semibold text-ink">Phone</div>
          <input {...register("phone")} inputMode="numeric" className={inputCls} />
          {errors.phone && <p className="mt-1.5 text-xs text-danger">{errors.phone.message}</p>}
        </div>
        <div className="mt-1 flex justify-end gap-1">
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-muted-foreground hover:text-ink">Cancel</button>
          <button type="button" onClick={handleSubmit(onSubmit)} disabled={mutation.isPending} className="rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-bold text-ink transition-colors hover:bg-brand-bright disabled:opacity-60">
            {mutation.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}

function AddressDialog({ open, onOpenChange, editing }) {
  const createMutation = useCreateAddressMutation();
  const updateMutation = useUpdateAddressMutation();
  const isEdit = Boolean(editing);
  const mutation = isEdit ? updateMutation : createMutation;

  const onSubmit = (values) => {
    const opts = {
      onSuccess: () => { toast.success(isEdit ? "Address updated" : "Address saved"); onOpenChange(false); },
      onError: () => toast.error("Could not save address"),
    };
    if (isEdit) updateMutation.mutate({ id: editing._id, payload: values }, opts);
    else createMutation.mutate(values, opts);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title={isEdit ? "Edit address" : "Add address"}>
      <AddressForm
        onSubmit={onSubmit}
        isSubmitting={mutation.isPending}
        onCancel={() => onOpenChange(false)}
        defaultValues={editing ?? undefined}
        submitLabel={isEdit ? "Save changes" : "Save address"}
      />
    </ResponsiveModal>
  );
}

/* ---------- hub cards ---------- */

function RecentOrderCard({ order }) {
  return (
    <Link to={`/orders/${order.orderNumber}`} className={cn(CARD, "block transition-shadow hover:shadow-[0_12px_32px_rgba(16,18,8,0.08)]")}>
      <div className="flex items-center justify-between">
        <div className={LABEL}>Recent order</div>
        <StatusChip status={order.status} size="sm" />
      </div>
      <div className="mt-3 font-display text-[16.5px] font-bold text-ink">{order.orderNumber}</div>
      <div className="mt-1.5 text-[13px] text-muted-foreground">
        {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""} · {formatTaka(order.total)} · {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
      </div>
      <div className={LINK_ARROW}>Track order <ArrowRight size={13} strokeWidth={2.4} /></div>
    </Link>
  );
}

function WishlistCard({ count }) {
  return (
    <Link to={ROUTES.WISHLIST} className={cn(CARD, "block transition-shadow hover:shadow-[0_12px_32px_rgba(16,18,8,0.08)]")}>
      <div className="flex items-center justify-between">
        <div className={LABEL}>Wishlist</div>
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#EFF5DC] text-brand-deep"><Heart size={15} strokeWidth={1.9} /></span>
      </div>
      <div className="mt-3 font-display text-[16.5px] font-bold text-ink">{count} piece{count !== 1 ? "s" : ""} on your radar</div>
      <div className="mt-1.5 text-[13px] text-muted-foreground">Restock &amp; price-drop alerts are on for saved items.</div>
      <div className={LINK_ARROW}>View wishlist <ArrowRight size={13} strokeWidth={2.4} /></div>
    </Link>
  );
}

function AddressesCard({ addresses, onAdd, onEdit }) {
  const primary = addresses?.[0];
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between">
        <div className={LABEL}>Addresses</div>
        <button type="button" onClick={onAdd} className="text-[12.5px] font-bold text-brand-deep">Add new</button>
      </div>
      {primary ? (
        <div className="mt-3.5 rounded-[14px] border-[1.5px] border-brand bg-[#FBFDF3] p-[14px_16px]">
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-bold text-ink">{primary.label || "Default"}</span>
            <button type="button" onClick={() => onEdit(primary)} className="text-[12px] font-bold text-brand-deep">Edit</button>
          </div>
          <div className="mt-1.5 text-[12.5px] leading-[1.55] text-muted-foreground">
            {formatAddressLine(primary)}
            <br />
            {primary.phone}
          </div>
        </div>
      ) : (
        <p className="mt-3.5 text-[13px] text-muted-foreground">No saved addresses yet.</p>
      )}
    </div>
  );
}

function AccountDetailsCard({ user, onEdit }) {
  const Row = ({ label, value, last }) => (
    <div className={cn("flex justify-between gap-4 py-3 text-[13.5px]", !last && "border-b border-line-soft")}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-ink">{value || "—"}</span>
    </div>
  );
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between">
        <div className={LABEL}>Account details</div>
        <button type="button" onClick={onEdit} className="text-[12.5px] font-bold text-brand-deep">Edit</button>
      </div>
      <div className="mt-1.5">
        <Row label="Name" value={user.name} />
        <Row label="Email" value={user.email} />
        <Row label="Phone" value={user.phone} last />
      </div>
    </div>
  );
}

function HelpCard() {
  return (
    <div className="rounded-[20px] bg-ink p-[22px]">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand">Need a hand?</div>
      <div className="mt-3 font-display text-[16.5px] font-bold text-white">We usually reply within the hour.</div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link to={ROUTES.CONTACT} className="rounded-full bg-brand px-[18px] py-2.5 text-[12.5px] font-bold text-ink">Contact us</Link>
        <Link to={ROUTES.FAQ} className="rounded-full border border-white/25 px-[18px] py-2.5 text-[12.5px] font-semibold text-white">FAQ</Link>
      </div>
    </div>
  );
}

/* ---------- mobile menu ---------- */

function MenuRow({ to, onClick, icon: Icon, label, trailing, last }) {
  const inner = (
    <>
      {Icon && <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EFF5DC] text-brand-deep"><Icon size={16} strokeWidth={1.9} /></span>}
      <span className="flex-1 text-sm font-semibold text-ink">{label}</span>
      {trailing}
      <ChevronRight size={15} strokeWidth={2} className="text-faint" />
    </>
  );
  const cls = cn("flex items-center gap-3.5 px-4 py-[15px] text-left", !last && "border-b border-tile");
  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cn(cls, "w-full")}>{inner}</button>;
}

/* ---------- page ---------- */

export function AccountPage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: orders } = useMyOrders();
  const { data: wishlist } = useWishlist();
  const { data: addresses } = useAddresses();
  const logout = useLogoutMutation();
  const deactivate = useDeactivateAccountMutation();

  const [editProfile, setEditProfile] = useState(false);
  const [addrDialog, setAddrDialog] = useState(null); // null | {editing?}
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!user) return null;

  const recentOrder = orders?.[0];
  const wishlistCount = wishlist?.length ?? 0;
  const primaryAddr = addresses?.[0];
  const since = monthYear(user.createdAt);

  const onSignOut = () => logout.mutate(undefined, { onSuccess: () => navigate(ROUTES.HOME) });
  const openAddr = (editing) => setAddrDialog({ editing });

  return (
    <>
      <Seo title="My account" noindex />
      <div className="mx-auto w-full max-w-[1160px] px-4 pb-6 pt-5 md:px-10 md:pb-10 md:pt-10">
        {/* Profile — desktop card */}
        <div className="hidden items-center gap-5 rounded-[24px] border border-line bg-white p-[26px_28px] md:flex">
          <div className="flex size-16 items-center justify-center rounded-full bg-ink font-display text-[22px] font-extrabold text-brand-glow">{initials(user.name)}</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[22px] font-extrabold tracking-[-0.01em] text-ink">{user.name}</div>
            <div className="mt-1 text-[13.5px] text-muted-foreground">{user.email}{user.phone && ` · ${user.phone}`}</div>
          </div>
          {since && <span className="rounded-full bg-[#EFF5DC] px-3.5 py-[7px] text-xs font-bold text-brand-deep">Collector since {since}</span>}
        </div>

        {/* Profile — mobile row */}
        <div className="flex items-center gap-3.5 md:hidden">
          <div className="flex size-14 items-center justify-center rounded-full bg-ink font-display text-[19px] font-extrabold text-brand-glow">{initials(user.name)}</div>
          <div className="min-w-0">
            <div className="font-display text-[20px] font-extrabold tracking-[-0.01em] text-ink">{user.name}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>

        {/* ---------- desktop hub grid ---------- */}
        <div className="mt-[18px] hidden grid-cols-[repeat(auto-fit,minmax(360px,1fr))] items-start gap-[18px] md:grid">
          {recentOrder && <RecentOrderCard order={recentOrder} />}
          <WishlistCard count={wishlistCount} />
          <AddressesCard addresses={addresses} onAdd={() => openAddr(null)} onEdit={(a) => openAddr(a)} />
          <AccountDetailsCard user={user} onEdit={() => setEditProfile(true)} />
          <HelpCard />
        </div>

        {/* Delete account strip (desktop) */}
        <div className="mt-[26px] hidden flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[#EFDDDB] bg-[#FCF7F6] p-[18px_22px] md:flex">
          <div className="text-[12.5px] leading-[1.5] text-[#8A5B55]">Want your account and data removed? We action deletion requests within 7 days.</div>
          <button type="button" onClick={() => setDeleteOpen(true)} className="text-[12.5px] font-bold text-danger">Delete account</button>
        </div>

        {/* ---------- mobile ---------- */}
        <div className="md:hidden">
          {recentOrder && (
            <Link to={`/orders/${recentOrder.orderNumber}`} className="mt-[18px] flex items-center gap-3 rounded-[18px] border border-line bg-white p-[14px_16px]">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F7EAD6] text-[#B45309]"><Package size={16} strokeWidth={1.9} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-ink">Order {recentOrder.orderNumber} is {recentOrder.status}</div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">{recentOrder.items.length} item{recentOrder.items.length !== 1 ? "s" : ""} · {formatTaka(recentOrder.total)} · tap to track</div>
              </div>
              <ChevronRight size={15} strokeWidth={2} className="text-faint" />
            </Link>
          )}

          <div className="mt-3.5 overflow-hidden rounded-[20px] border border-line bg-white">
            <MenuRow to={ROUTES.ORDERS} icon={Package} label="My orders" />
            <MenuRow to={ROUTES.WISHLIST} icon={Heart} label="Wishlist" trailing={<span className="text-xs font-bold text-brand-deep">{wishlistCount}</span>} />
            <MenuRow onClick={() => openAddr(primaryAddr ?? null)} icon={MapPin} label="Addresses" trailing={primaryAddr && <span className="text-[11.5px] text-faint">{primaryAddr.label || "Default"}</span>} />
            <MenuRow onClick={() => setEditProfile(true)} icon={User} label="Account details" last />
          </div>

          <div className="mt-3.5 overflow-hidden rounded-[20px] border border-line bg-white">
            <MenuRow to={ROUTES.FAQ} label="Help &amp; FAQ" />
            <MenuRow to={ROUTES.CONTACT} label="Contact us" />
            <MenuRow to={ROUTES.TERMS} label="Policies" last />
          </div>

          <div className="mt-[18px]">
            <button type="button" onClick={onSignOut} disabled={logout.isPending} className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-ink text-[13.5px] font-bold text-ink disabled:opacity-60">
              <LogOut size={16} strokeWidth={1.9} /> Sign out
            </button>
            <button type="button" onClick={() => setDeleteOpen(true)} className="mt-4 w-full text-center text-[11.5px] font-semibold text-danger">Delete account &amp; data</button>
          </div>
        </div>
      </div>

      <EditProfileDialog open={editProfile} onOpenChange={setEditProfile} user={user} />
      <AddressDialog open={addrDialog !== null} onOpenChange={(v) => !v && setAddrDialog(null)} editing={addrDialog?.editing} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>You'll be signed out immediately. This doesn't delete your existing order history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deactivate.mutate(undefined, { onError: () => toast.error("Could not delete account") })} className="bg-danger text-white hover:bg-danger/90">
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
