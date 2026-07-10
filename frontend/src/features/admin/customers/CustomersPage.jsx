import { useState } from "react";
import { Link } from "react-router";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminUsers } from "./api/useAdminUsers";

const ROLE_OPTIONS = ["customer", "staff", "admin"];

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function roleBadgeVariant(role) {
  if (role === "admin") return "default";
  if (role === "staff") return "secondary";
  return "outline";
}

export function CustomersPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useAdminUsers({
    page,
    limit: 20,
    role: role === "all" ? undefined : role,
    q: debouncedSearch || undefined,
  });

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl">Customers</h1>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={role}
          onValueChange={(v) => {
            setRole(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          )}
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Link to={user.id} className="font-medium hover:text-primary">
                  {user.name}
                </Link>
                {user.isGuest && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Guest
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email || "—"}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
              <TableCell>
                <Badge variant={roleBadgeVariant(user.role)} className="capitalize">
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                {user.isActive ? (
                  <span className="text-xs text-primary">Active</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Deactivated</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
