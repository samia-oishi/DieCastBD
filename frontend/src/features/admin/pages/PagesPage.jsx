import { useState } from "react";
import { Link } from "react-router";
import { Plus, FileText, ChevronRight, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
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
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { adminToast } from "@/features/admin/shell/adminToast";
import { useAdminPages, useDeletePageMutation } from "./api/useAdminPages";

/** Pages the storefront routes to directly — the API refuses to delete these,
 * so the row doesn't offer a button that could only ever return a 409. */
const SYSTEM_SLUGS = new Set(["terms-conditions", "privacy-policy", "refund-policy", "shipping-policy"]);

/** The design's "N blocks" line. Real now that blocks persist — it was omitted
 * while the builder was UI-only rather than shown as a fabricated zero. */
function blockCount(page) {
  const n = page.blocks?.length ?? 0;
  return `${n} block${n === 1 ? "" : "s"}`;
}

function formatDate(dateString) {
  return dateString ? new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

export function PagesPage() {
  const { data: pages, isLoading } = useAdminPages();
  const deleteMutation = useDeletePageMutation();
  const [pendingDelete, setPendingDelete] = useState(null);

  const list = pages ?? [];

  const onConfirmDelete = () => {
    deleteMutation.mutate(pendingDelete._id, {
      onSuccess: () => {
        adminToast(`${pendingDelete.title} deleted`);
        setPendingDelete(null);
      },
      onError: (err) => {
        adminToast(err.response?.data?.message ?? "Could not delete page");
        setPendingDelete(null);
      },
    });
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <AdminPageHeader
        eyebrow={list.length ? `${list.length} page${list.length === 1 ? "" : "s"}` : "Content"}
        title="Pages"
        subtitle="Build any storefront page from blocks — policies, guides, or promo pages for a drop or a discount."
        actions={
          <AdminButton asChild>
            <Link to="new">
              <Plus size={14} strokeWidth={2.2} /> New page
            </Link>
          </AdminButton>
        }
      />

      <section className="overflow-hidden rounded-[18px] border border-line bg-white">
        {isLoading && <p className="px-5 py-10 text-center text-[13.5px] text-faint">Loading…</p>}
        {!isLoading && list.length === 0 && (
          <p className="px-5 py-10 text-center text-[13.5px] text-faint">No pages yet — create your first one.</p>
        )}

        {list.map((page) => (
          <div
            key={page._id}
            className="relative flex items-center gap-3 border-b border-line-soft px-5 py-3 transition-colors last:border-b-0 hover:bg-[#FCFCF9]"
          >
            {/* Whole row opens the builder; the delete button sits above it. */}
            <Link to={page._id} aria-label={`Edit ${page.title}`} tabIndex={-1} className="absolute inset-0 z-0" />

            <span className="pointer-events-none flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-tile text-faint">
              <FileText size={14} strokeWidth={1.8} />
            </span>
            <span className="pointer-events-none min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-ink">{page.title}</span>
              <span className="mt-px block truncate text-[11.5px] text-faint">
                /{page.slug} · {blockCount(page)} · updated {formatDate(page.updatedAt)}
              </span>
            </span>
            <span
              className={cn(
                "pointer-events-none shrink-0 rounded-full px-2.5 py-[3px] text-[10px] font-bold",
                page.isPublished ? "bg-brand-glow text-brand-deep" : "bg-tile text-faint"
              )}
            >
              {page.isPublished ? "Published" : "Draft"}
            </span>

            {SYSTEM_SLUGS.has(page.slug) ? (
              <span
                title="The storefront links to this page from its footer"
                className="pointer-events-none flex size-[30px] shrink-0 items-center justify-center text-[#D7D9CE]"
              >
                <Trash2 size={13} strokeWidth={1.8} />
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setPendingDelete(page)}
                aria-label={`Delete ${page.title}`}
                title="Delete page"
                className="relative z-10 flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border border-line bg-white text-faint transition-colors hover:border-[#F0C9C5] hover:bg-[#FDF6F5] hover:text-[#B3261E]"
              >
                <Trash2 size={13} strokeWidth={1.8} />
              </button>
            )}

            <ChevronRight size={15} strokeWidth={2} className="pointer-events-none shrink-0 text-faint" />
          </div>
        ))}
      </section>

      <AlertDialog open={!!pendingDelete} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the page and its {pendingDelete ? blockCount(pendingDelete) : "blocks"} for good.
              {pendingDelete?.isPublished
                ? ` It's published, so /${pendingDelete.slug} will start returning “not found” to anyone holding the link.`
                : " It's a draft, so nothing on the storefront changes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-[#E5484D] text-white hover:bg-[#CF3B40]"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete page"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
