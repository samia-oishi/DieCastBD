import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Storefront-only pill pagination, matching DiecastBD Shop.dc.html exactly.
// Deliberately NOT the shared components/shared/Pagination.jsx — that
// component is also used by 4 admin pages (Inventory/Customers/Newsletter/
// Orders), which must stay pixel-identical to the original dark theme;
// styling it with the redesign's raw brand tokens (bg-ink, text-faint, etc.)
// would leak the light theme into admin, since those tokens are only
// declared in :root and never redeclared inside the
// [data-theme="diecastbd-admin"] scope (unlike the standard shadcn
// semantic tokens the shared component uses).
function getPageNumbers(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

function PageButton({ active, disabled, children, ...props }) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "flex size-9.5 items-center justify-center rounded-full text-[13.5px] font-bold transition-colors md:size-10",
        active
          ? "bg-ink text-white"
          : "border border-[#DDDFD2] bg-card text-ink-soft hover:border-foreground disabled:pointer-events-none disabled:text-faint disabled:hover:border-[#DDDFD2]"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ShopPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <PageButton aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="size-3.5" />
      </PageButton>

      {pageNumbers.map((num, i) => {
        const prev = pageNumbers[i - 1];
        const showEllipsis = prev != null && num - prev > 1;
        return (
          <span key={num} className="flex items-center gap-2">
            {showEllipsis && <span className="px-0.5 text-sm text-muted-foreground">…</span>}
            <PageButton active={num === page} onClick={() => onPageChange(num)}>
              {num}
            </PageButton>
          </span>
        );
      })}

      <PageButton aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight className="size-3.5" />
      </PageButton>
    </nav>
  );
}
