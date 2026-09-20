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
import { FilterChips } from "@/features/admin/shell/FilterChips";
import { adminToast } from "@/features/admin/shell/adminToast";
import { useAdminAudience, useDeleteSubscriberMutation } from "./api/useAdminNewsletter";
import { listAdminAudience } from "./api/newsletterApi";

const GRID = "md:grid-cols-[minmax(0,1fr)_210px_120px_44px]";

const PAGE_SIZE = 50;

// The four doors an address can come in through. They are NOT equivalent
// permissions, which is the whole reason the source is shown per row: only
// "newsletter" is someone asking to be marketed to. The rest gave an address
// to receive something specific — a receipt, a restock alert, an account.
const SOURCE_META = {
  newsletter: { label: "Newsletter", bg: "#EFF5DC", color: "#4F6B0B", hint: "Signed up on the storefront" },
  customer: { label: "Customer", bg: "#EFEFE9", color: "#3A3D33", hint: "Created an account" },
  order: { label: "Order", bg: "#DCEFEA", color: "#0F6B58", hint: "Gave an email at checkout" },
  notify: { label: "Notify", bg: "#F7EAD6", color: "#B45309", hint: "Waiting on a restock" },
};

const SOURCE_ORDER = ["newsletter", "customer", "order", "notify"];

function formatDate(dateString) {
  return dateString
    ? new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    : "—";
}

function SourceBadge({ source }) {
  const meta = SOURCE_META[source] ?? { label: source, bg: "#EFEFE9", color: "#3A3D33" };
  return (
    <span
      title={meta.hint}
      className="inline-flex shrink-0 items-center rounded-full px-2 py-[2px] text-[10px] font-bold"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

/** Quotes every field so an address containing a comma can't shift the columns.
 * The Source column ships with it deliberately — an export that flattened four
 * different permissions into one undifferentiated list is precisely how a shop
 * ends up mailing people who never asked. */
function toCsv(people) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = people.map((p) =>
    [escape(p.email), escape(p.name ?? ""), escape(p.sources.join(" + ")), escape(formatDate(p.firstSeen))].join(",")
  );
  return ["Email,Name,Source,First seen", ...rows].join("\n");
}

function downloadCsv(people, source) {
  const blob = new Blob([toCsv(people)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `diecastbd-audience-${source}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function NewsletterPage() {
  const [page, setPage] = useState(1);
  const [source, setSource] = useState("all");
  const [search, setSearch] = useState("");
  const [pendingRemove, setPendingRemove] = useState(null);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useAdminAudience({
    page,
    limit: PAGE_SIZE,
    source,
    q: debouncedSearch || undefined,
  });
  const deleteMutation = useDeleteSubscriberMutation();

  const people = data?.data ?? [];
  const meta = data?.meta;
  const counts = meta?.counts ?? {};

  const chips = [
    { value: "all", label: "All", count: counts.all },
    ...SOURCE_ORDER.map((s) => ({ value: s, label: SOURCE_META[s].label, count: counts[s] })),
  ];

  const resetTo = (fn) => (value) => {
    fn(value);
    setPage(1);
  };

  // Exports the WHOLE filtered set, not the page on screen. Downloading a file
  // called "audience" that silently stopped at 50 rows is the kind of thing
  // nobody notices until a campaign has already gone out short.
  const onExport = async () => {
    setExporting(true);
    try {
      const res = await listAdminAudience({ page: 1, limit: 500, source, q: debouncedSearch || undefined });
      const rows = res?.data ?? [];
      if (!rows.length) {
        adminToast("Nothing to export");
        return;
      }
      downloadCsv(rows, source);
      adminToast(`${rows.length} address${rows.length === 1 ? "" : "es"} exported`);
    } catch {
      adminToast("Could not build the export");
    } finally {
      setExporting(false);
    }
  };

  const onConfirmRemove = () => {
    deleteMutation.mutate(pendingRemove.subscriberId, {
      onSuccess: () => {
        adminToast(`${pendingRemove.email} removed from the newsletter`);
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
        eyebrow={meta ? `${meta.total} address${meta.total === 1 ? "" : "es"}` : "Audience"}
        title="Audience"
        subtitle="Every email the shop holds, and where each one came from."
        actions={
          <AdminButton variant="outline" disabled={!people.length || exporting} onClick={onExport}>
            <Download size={14} strokeWidth={2} /> {exporting ? "Preparing…" : "Export CSV"}
          </AdminButton>
        }
      />

      <div className="flex flex-col gap-3">
        <AdminSearch
          value={search}
          onChange={(e) => resetTo(setSearch)(e.target.value)}
          placeholder="Search email or name…"
          className="max-w-[340px]"
        />
        <FilterChips chips={chips} value={source} onChange={resetTo(setSource)} />
      </div>

      <section className="overflow-hidden rounded-[18px] border border-line bg-white">
        <div
          className={cn(
            "hidden items-center gap-3 border-b border-line-soft px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-faint md:grid",
            GRID
          )}
        >
          <span>Email</span>
          <span>Source</span>
          <span>First seen</span>
          <span />
        </div>

        {isLoading && <p className="px-5 py-10 text-center text-[13.5px] text-faint">Loading…</p>}
        {!isLoading && people.length === 0 && (
          <p className="px-5 py-10 text-center text-[13.5px] text-faint">
            {debouncedSearch ? "No addresses match that search." : "Nothing here yet."}
          </p>
        )}

        {people.map((p) => (
          <div
            key={p.email}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_44px] items-center gap-3 border-b border-line-soft px-5 py-2.5 last:border-b-0 hover:bg-[#FCFCF9]",
              GRID
            )}
          >
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-ink">{p.email}</span>
              {p.name && <span className="block truncate text-[11.5px] text-faint">{p.name}</span>}
              {/* No source or date column at mobile width — both ride under the
                  address instead of being dropped. */}
              <span className="mt-1 flex flex-wrap items-center gap-1 md:hidden">
                {p.sources.map((s) => (
                  <SourceBadge key={s} source={s} />
                ))}
                <span className="text-[11.5px] text-faint">· {formatDate(p.firstSeen)}</span>
              </span>
            </span>
            <span className="hidden flex-wrap items-center gap-1 md:flex">
              {p.sources.map((s) => (
                <SourceBadge key={s} source={s} />
              ))}
            </span>
            <span className="hidden text-[12px] text-[#6B6E60] md:block">{formatDate(p.firstSeen)}</span>
            {/* Removal only makes sense for an actual newsletter subscription.
                There is nothing to "remove" about a customer's address — that
                would mean deleting their account — so those rows have no button
                rather than one that fails or quietly does something else. */}
            {p.subscriberId ? (
              <button
                type="button"
                onClick={() => setPendingRemove(p)}
                title="Remove from the newsletter"
                aria-label={`Remove ${p.email} from the newsletter`}
                className="flex size-[30px] items-center justify-center justify-self-end rounded-[9px] border border-line bg-white text-faint transition-colors hover:border-[#F0C9C5] hover:bg-[#FDF6F5] hover:text-[#B3261E]"
              >
                <Trash2 size={13} strokeWidth={1.8} />
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
      </section>

      <p className="text-[12px] leading-[1.6] text-faint">
        Only <strong className="font-semibold text-ink-soft">Newsletter</strong> addresses asked to be marketed to. The
        others gave an email to get a receipt, a restock alert or an account, so check your local rules before adding
        them to a campaign — the export keeps the source column for exactly that reason. Restock contacts left as phone
        numbers are not listed here, since there is no SMS provider.
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
            <AlertDialogTitle>Remove {pendingRemove?.email} from the newsletter?</AlertDialogTitle>
            <AlertDialogDescription>
              They stop receiving campaigns immediately. If they also have an account or an order, that is untouched and
              the address stays listed here under its other sources.
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
