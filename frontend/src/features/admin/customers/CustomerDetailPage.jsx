import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
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
import { useCurrentUser } from "@/features/auth/api/useAuth";
import { useAdminUser, useUpdateAdminUserMutation, useChangeUserRoleMutation } from "./api/useAdminUsers";

const ROLE_OPTIONS = ["customer", "staff", "admin"];

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const { data: currentUser } = useCurrentUser();
  const { data: user, isLoading } = useAdminUser(id);
  const updateMutation = useUpdateAdminUserMutation();
  const roleMutation = useChangeUserRoleMutation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pendingRole, setPendingRole] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  if (isLoading || !user) return <FullPageLoader />;

  const isSelf = currentUser?.id === user.id;

  const onSaveProfile = () => {
    updateMutation.mutate(
      { id, payload: { name, phone } },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (err) => toast.error(err.response?.data?.message ?? "Could not update user"),
      }
    );
  };

  const onToggleActive = (checked) => {
    updateMutation.mutate(
      { id, payload: { isActive: checked } },
      {
        onSuccess: () => toast.success(checked ? "Account activated" : "Account deactivated"),
        onError: (err) => toast.error(err.response?.data?.message ?? "Could not update status"),
      }
    );
  };

  const onConfirmRoleChange = () => {
    roleMutation.mutate(
      { id, role: pendingRole },
      {
        onSuccess: () => {
          toast.success("Role updated");
          setPendingRole(null);
        },
        onError: (err) => {
          toast.error(err.response?.data?.message ?? "Could not update role");
          setPendingRole(null);
        },
      }
    );
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-16">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="..">
          <ChevronLeft /> Back to customers
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl">{user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {user.email} · Joined {formatDateTime(user.createdAt)}
            {user.lastLoginAt && ` · Last login ${formatDateTime(user.lastLoginAt)}`}
          </p>
        </div>
        <Badge variant={user.role === "admin" ? "default" : user.role === "staff" ? "secondary" : "outline"} className="capitalize">
          {user.role}
        </Badge>
      </div>

      <div className="rounded-lg border border-border p-6">
        <h2 className="mb-4 font-heading text-lg">Profile</h2>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <Button onClick={onSaveProfile} disabled={updateMutation.isPending} className="w-fit">
            Save
          </Button>
        </FieldGroup>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-6">
        <div>
          <p className="font-medium">Account active</p>
          <p className="text-sm text-muted-foreground">Deactivating blocks this user from signing in.</p>
        </div>
        <Switch checked={user.isActive} onCheckedChange={onToggleActive} disabled={updateMutation.isPending} />
      </div>

      <div className="rounded-lg border border-border p-6">
        <h2 className="mb-1 font-heading text-lg">Role</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {isSelf
            ? "You cannot change your own role."
            : "Admins have full dashboard access. Staff can manage orders and catalog but not other users' roles."}
        </p>
        <Select value={user.role} onValueChange={setPendingRole} disabled={isSelf || roleMutation.isPending}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={!!pendingRole} onOpenChange={(open) => !open && setPendingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change role to {pendingRole}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRole === "admin"
                ? `${user.name} will get full access to the admin dashboard, including user management.`
                : `${user.name} will lose their current "${user.role}" permissions.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmRoleChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
