import { Link } from "react-router";
import { Plus, FileText, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { useAdminPages } from "./api/useAdminPages";

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
  const list = pages ?? [];

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
          <Link
            key={page._id}
            to={page._id}
            className="flex items-center gap-3 border-b border-line-soft px-5 py-3 transition-colors last:border-b-0 hover:bg-[#FCFCF9]"
          >
            <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-tile text-faint">
              <FileText size={14} strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-ink">{page.title}</span>
              <span className="mt-px block truncate text-[11.5px] text-faint">
                /{page.slug} · {blockCount(page)} · updated {formatDate(page.updatedAt)}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-[3px] text-[10px] font-bold",
                page.isPublished ? "bg-brand-glow text-brand-deep" : "bg-tile text-faint"
              )}
            >
              {page.isPublished ? "Published" : "Draft"}
            </span>
            <ChevronRight size={15} strokeWidth={2} className="shrink-0 text-faint" />
          </Link>
        ))}
      </section>
    </div>
  );
}
