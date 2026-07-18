import { useState } from "react";
import { Download, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Pagination } from "@/components/shared/Pagination";
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
import { useDebounce } from "@/hooks/useDebounce";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminSearch } from "@/features/admin/shell/AdminSearch";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { adminToast } from "@/features/admin/shell/adminToast";
import { useAdminSubscribers, useDeleteSubscriberMutation } from "./api/useAdminNewsletter";

const GRID = "md:grid-cols-[minmax(0,1fr)_120px_44px]";

function formatDate(dateString) {
  return dateString ? new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

/** Quotes every field so an address containing a comma can't shift the columns. */
function toCsv(subscribers) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = subscribers.map((s) => [escape(s.email), escape(formatDate(s.subscribedAt))].join(","));
  return ["Email,Subscribed", ...rows].join("\n");
}

function downloadCsv(subscribers) {
  const blob = new Blob([toCsv(subscribers)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "diecastbd-newsletter-subscribers.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function NewsletterPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pendingRemove, setPendingRemove] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useAdminSubscribers({ page, limit: 50, q: debouncedSearch || undefined });
  const deleteMutation = useDeleteSubscriberMutation();

  const subscribers = data?.data ?? [];
  const meta = data?.meta;

  const onConfirmRemove = () => {
    deleteMutation.mutate(pendingRemove._id, {
      onSuccess: () => {
        adminToast(`${pendingRemove.email} removed`);
        setPendingRemove(null);
      },
      onError: (err) => {
        adminToast(err.response?.data?.message ?? "Could not remove subscriber");
        setPendingRemove(null);
      },
    });
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <AdminPageHeader
        eyebrow={meta ? `${meta.total} subscriber${meta.total === 1 ? "" : "s"}` : "Audience"}
        title="Newsletter"
        subtitle="Emails collected by the storefront signup form."
        actions={
          <AdminButton variant="outline" disabled={!subscribers.length} onClick={() => downloadCsv(subscribers)}>
            <Download size={14} strokeWidth={2} /> Export CSV
          </AdminButton>
        }
      />

      <AdminSearch
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search email…"
        className="max-w-[340px]"
      />

      <section className="overflow-hidden rounded-[18px] border border-line bg-white">
        <div className={cn("hidden items-center gap-3 border-b border-line-soft px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-faint md:grid", GRID)}>
          <span>Email</span>
          <span>Subscribed</span>
          <span />
        </div>

        {isLoading && <p className="px-5 py-10 text-center text-[13.5px] text-faint">Loading…</p>}
        {!isLoading && subscribers.length === 0 && (
          <p className="px-5 py-10 text-center text-[13.5px] text-faint">
            {debouncedSearch ? "No subscribers match that search." : "No one has signed up yet."}
          </p>
        )}

        {subscribers.map((s) => (
          <div
            key={s._id}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_44px] items-center gap-3 border-b border-line-soft px-5 py-2.5 last:border-b-0 hover:bg-[#FCFCF9]",
              GRID
            )}
          >
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-ink">{s.email}</span>
              {/* No date column at mobile width, so it rides under the email instead. */}
              <span className="block text-[11.5px] text-faint md:hidden">{formatDate(s.subscribedAt)}</span>
            </span>
            <span className="hidden text-[12px] text-[#6B6E60] md:block">{formatDate(s.subscribedAt)}</span>
            <button
              type="button"
              onClick={() => setPendingRemove(s)}
              title="Remove subscriber"
              aria-label={`Remove ${s.email}`}
              className="flex size-[30px] items-center justify-center justify-self-end rounded-[9px] border border-line bg-white text-faint transition-colors hover:border-[#F0C9C5] hover:bg-[#FDF6F5] hover:text-[#B3261E]"
            >
              <Trash2 size={13} strokeWidth={1.8} />
            </button>
          </div>
        ))}
      </section>

      <p className="text-[12px] leading-[1.6] text-faint">
        Export gives you a CSV ready to import into any email tool. Removed subscribers stop receiving campaigns immediately.
      </p>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-faint">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}

      <AlertDialog open={!!pendingRemove} onOpenChange={(v) => !v && setPendingRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingRemove?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              They stop receiving campaigns immediately. Nothing stops them signing up again from the storefront.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmRemove();
              }}
              disabled={deleteMutation.isPending}
              className="bg-[#E5484D] text-white hover:bg-[#CF3B40]"
            >
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
