import { useState } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTaka } from "@/lib/currency";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminSearch } from "@/features/admin/shell/AdminSearch";
import { FilterChips } from "@/features/admin/shell/FilterChips";
import { useAdminUsers } from "./api/useAdminUsers";

const GRID = "md:grid-cols-[minmax(170px,1.3fr)_minmax(180px,1.3fr)_92px_74px_96px_80px_26px]";

// Staff teal / Admin lime / Customer neutral, per the design's role pills.
const ROLE_PILL = {
  admin: "bg-brand-glow text-ink",
  staff: "bg-[#E6F4F7] text-[#0E7490]",
  customer: "bg-tile text-ink-soft",
};

const CHIPS = [
  { value: "all", label: "All" },
  { value: "registered", label: "Registered" },
  { value: "guests", label: "Guests" },
  { value: "team", label: "Admins & staff" },
];

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function CustomersPage() {
  const [page, setPage] = useState(1);
  const [chip, setChip] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // "Admins & staff" spans two role values, so that chip narrows the page
  // client-side; the other three map straight onto API params.
  const params = {
    page,
    limit: 20,
    q: debouncedSearch || undefined,
    ...(chip === "registered" ? { isGuest: false } : {}),
    ...(chip === "guests" ? { isGuest: true } : {}),
  };

  const { data, isLoading } = useAdminUsers(params);
  const all = data?.data ?? [];
  const users = chip === "team" ? all.filter((u) => u.role === "admin" || u.role === "staff") : all;
  const meta = data?.meta;

  const onChip = (value) => {
    setChip(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <AdminPageHeader
        eyebrow={meta ? `${meta.total} customer${meta.total === 1 ? "" : "s"}` : "People"}
        title="Customers"
      />

      <div className="flex flex-col gap-3">
        <AdminSearch
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or email…"
          className="max-w-md"
        />
        <FilterChips chips={CHIPS} value={chip} onChange={onChip} />
      </div>

      <section className="overflow-x-auto rounded-[18px] border border-line bg-white">
        <div className="md:min-w-[860px]">
          <div className={cn("hidden items-center gap-2.5 border-b border-line-soft px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-faint md:grid", GRID)}>
            <span>Name</span>
            <span>Email</span>
            <span>Joined</span>
            <span className="text-right">Orders</span>
            <span className="text-right">Spent</span>
            <span>Role</span>
            <span />
          </div>

          {isLoading && <p className="px-5 py-10 text-center text-[13.5px] text-faint">Loading…</p>}
          {!isLoading && users.length === 0 && (
            <p className="px-5 py-10 text-center text-[13.5px] text-faint">No customers match — try a different search or filter.</p>
          )}

          {users.map((u) => (
            <div
              key={u.id}
              className={cn(
                "relative grid grid-cols-1 items-center gap-2 border-b border-line-soft px-4 py-3 transition-colors last:border-b-0 hover:bg-[#FCFCF9] md:gap-2.5 md:px-5 md:py-2",
                GRID
              )}
            >
              <Link to={u.id} aria-label={`View ${u.name || "customer"}`} tabIndex={-1} className="absolute inset-0 z-0" />

              {/* desktop cells */}
              <div className="pointer-events-none hidden md:contents">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[13px] font-semibold text-ink">{u.name || "—"}</span>
                  {u.isGuest && (
                    <span className="shrink-0 rounded-full bg-tile px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.05em] text-faint">
                      Guest
                    </span>
                  )}
                </span>
                <span className="truncate text-[12.5px] text-[#6B6E60]">{u.email || "—"}</span>
                <span className="text-[12px] text-faint">{formatDate(u.createdAt)}</span>
                <span className="text-right text-[12.5px] font-bold text-ink">{u.orderCount ?? 0}</span>
                <span className="text-right text-[12.5px] font-bold text-ink">{formatTaka(u.totalSpent ?? 0)}</span>
                <span>
                  <span className={cn("inline-block rounded-full px-2 py-[3px] text-[10.5px] font-bold capitalize", ROLE_PILL[u.role] ?? ROLE_PILL.customer)}>
                    {u.role}
                  </span>
                </span>
                <ChevronRight size={15} strokeWidth={2} className="justify-self-end text-faint" />
              </div>

              {/* mobile row */}
              <div className="pointer-events-none flex items-center gap-3 md:hidden">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-semibold text-ink">{u.name || "—"}</span>
                    {u.isGuest && (
                      <span className="shrink-0 rounded-full bg-tile px-1.5 py-0.5 text-[9px] font-bold uppercase text-faint">Guest</span>
                    )}
                  </div>
                  <div className="truncate text-[11.5px] text-faint">{u.email || formatDate(u.createdAt)}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[12.5px] font-bold text-ink">{formatTaka(u.totalSpent ?? 0)}</span>
                  <span className="text-[11px] text-faint">{u.orderCount ?? 0} orders</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-faint">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
