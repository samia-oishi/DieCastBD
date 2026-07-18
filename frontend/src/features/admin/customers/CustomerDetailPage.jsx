import { useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, Link } from "react-router";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { formatTaka } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { StatusChip } from "@/components/shared/StatusChip";
import { SectionPanel } from "@/features/admin/shell/SectionPanel";
import { SaveBar } from "@/features/admin/shell/SaveBar";
import { adminToast } from "@/features/admin/shell/adminToast";
import { adminInputCls, adminSelectCls } from "@/features/admin/shell/adminFieldCls";
import { useCurrentUser } from "@/features/auth/api/useAuth";
import { useAdminUser, useUpdateAdminUserMutation, useChangeUserRoleMutation } from "./api/useAdminUsers";

const ROLE_PILL = {
  admin: "bg-brand-glow text-ink",
  staff: "bg-[#E6F4F7] text-[#0E7490]",
  customer: "bg-tile text-ink-soft",
};

const ROLE_HELP = {
  customer: "Shops and manages their own orders only.",
  staff: "Can manage orders and the catalogue, but not other users' roles.",
  admin: "Full dashboard access, including roles and settings.",
};

function formatDate(dateString) {
  return dateString ? new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-[14px] border border-line bg-white px-4 py-[13px]">
      <div className="text-[11px] font-semibold text-[#6B6E60]">{label}</div>
      <div className="mt-[5px] flex items-baseline gap-[7px]">
        <span className="font-display text-[21px] font-extrabold tracking-[-0.02em] text-ink">{value}</span>
        {sub && <span className="text-[11px] text-faint">{sub}</span>}
      </div>
    </div>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const { data: currentUser } = useCurrentUser();
  const { data: user, isLoading } = useAdminUser(id);
  const updateMutation = useUpdateAdminUserMutation();
  const roleMutation = useChangeUserRoleMutation();

  const [pendingRole, setPendingRole] = useState(null);

  // `values` re-syncs the form once the query resolves; isDirty then drives the
  // save bar. Profile edits are the only thing batched — the active toggle and
  // role change apply immediately (role behind a confirm).
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    defaultValues: { name: "", phone: "" },
    values: user ? { name: user.name ?? "", phone: user.phone ?? "" } : undefined,
  });

  if (isLoading || !user) return <FullPageLoader />;

  const isSelf = currentUser?.id === user.id;

  const onSaveProfile = (values) => {
    updateMutation.mutate(
      { id, payload: values },
      {
        onSuccess: () => {
          adminToast("Customer saved");
          reset(values);
        },
        onError: (err) => adminToast(err.response?.data?.message ?? "Could not update customer"),
      }
    );
  };

  const onToggleActive = (checked) => {
    updateMutation.mutate(
      { id, payload: { isActive: checked } },
      {
        onSuccess: () => adminToast(checked ? "Account activated" : "Account deactivated"),
        onError: (err) => adminToast(err.response?.data?.message ?? "Could not update status"),
      }
    );
  };

  const onConfirmRoleChange = () => {
    roleMutation.mutate(
      { id, role: pendingRole },
      {
        onSuccess: () => {
          adminToast("Role updated");
          setPendingRole(null);
        },
        onError: (err) => {
          adminToast(err.response?.data?.message ?? "Could not update role");
          setPendingRole(null);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSaveProfile)} className="flex flex-col gap-[18px] pb-24">
      <Link to={`${ROUTES.ADMIN}/customers`} className="flex w-fit items-center gap-1 text-[13px] font-semibold text-ink-soft hover:text-ink">
        <ChevronLeft size={17} strokeWidth={2.2} /> Back to customers
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-[24px] font-extrabold tracking-[-0.015em] text-ink md:text-[30px]">
            {user.name || "Guest customer"}
          </h1>
          {user.isGuest && (
            <span className="rounded-full bg-tile px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.05em] text-faint">
              Guest checkout
            </span>
          )}
          <span className={cn("rounded-full px-2.5 py-1 text-[10.5px] font-bold capitalize", ROLE_PILL[user.role] ?? ROLE_PILL.customer)}>
            {user.role}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-[#6B6E60]">
          {[user.email, user.phone, `Joined ${formatDate(user.createdAt)}`].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
        <Stat label="Orders" value={user.orderCount ?? 0} sub="excl. cancelled" />
        <Stat label="Lifetime spend" value={formatTaka(user.totalSpent ?? 0)} />
        <Stat label="Last order" value={user.lastOrderAt ? formatDate(user.lastOrderAt) : "—"} />
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.3fr_1fr] lg:items-start">
        {/* left */}
        <div className="flex flex-col gap-[18px]">
          <SectionPanel title="Profile" bodyClassName="pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Name</span>
                <Input className={adminInputCls} {...register("name")} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Phone</span>
                <Input className={adminInputCls} {...register("phone")} placeholder="01XXXXXXXXX" />
              </label>
            </div>
            {user.email && (
              <p className="mt-2.5 text-[11.5px] text-faint">
                Email ({user.email}) is managed by the customer&apos;s sign-in and can&apos;t be edited here.
              </p>
            )}
          </SectionPanel>

          <SectionPanel
            title="Recent orders"
            action={
              <Link to={`${ROUTES.ADMIN}/orders`} className="text-[12.5px] font-semibold text-brand-deep hover:text-ink">
                View all orders
              </Link>
            }
            bodyClassName="pt-2"
          >
            {(user.recentOrders ?? []).length === 0 ? (
              <p className="py-4 text-center text-[13px] text-faint">No orders yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-line-soft">
                {user.recentOrders.map((o) => (
                  <Link
                    key={o._id}
                    to={`${ROUTES.ADMIN}/orders/${o._id}`}
                    className="flex items-center justify-between gap-3 py-2.5 hover:bg-[#FCFCF9]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[12.5px] font-bold text-ink">{o.orderNumber}</span>
                      <span className="block text-[11.5px] text-faint">{formatDate(o.createdAt)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2.5">
                      <StatusChip status={o.status} size="sm" />
                      <span className="text-[12.5px] font-bold text-ink">{formatTaka(o.total)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </SectionPanel>
        </div>

        {/* right rail */}
        <div className="flex flex-col gap-[18px]">
          <SectionPanel title="Account active" bodyClassName="pt-2">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[12.5px] leading-[1.5] text-[#6B6E60]">
                Deactivating blocks this user from signing in. Their orders stay untouched.
              </p>
              <Switch
                checked={user.isActive}
                onCheckedChange={onToggleActive}
                disabled={updateMutation.isPending || isSelf}
                aria-label="Account active"
                className="mt-0.5 shrink-0"
              />
            </div>
            {isSelf && <p className="mt-2 text-[11.5px] text-warn">You can&apos;t deactivate your own account.</p>}
          </SectionPanel>

          <SectionPanel title="Role" bodyClassName="pt-3">
            <Select value={user.role} onValueChange={(v) => v !== user.role && setPendingRole(v)} disabled={isSelf}>
              <SelectTrigger className={adminSelectCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-[12px] leading-[1.5] text-[#6B6E60]">
              {isSelf ? "You can't change your own role." : ROLE_HELP[user.role]}
            </p>
          </SectionPanel>
        </div>
      </div>

      <SaveBar dirty={isDirty} saving={updateMutation.isPending} onDiscard={() => reset()} saveLabel="Save customer" />

      <AlertDialog open={!!pendingRole} onOpenChange={(v) => !v && setPendingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make {user.name || "this customer"} {pendingRole}?</AlertDialogTitle>
            <AlertDialogDescription>{pendingRole && ROLE_HELP[pendingRole]}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={roleMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmRoleChange();
              }}
              disabled={roleMutation.isPending}
            >
              {roleMutation.isPending ? "Updating…" : "Change role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
