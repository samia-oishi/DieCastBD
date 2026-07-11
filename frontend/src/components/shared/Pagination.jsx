import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function getPageNumbers(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

function Circle({ children, active, disabled, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-[38px] items-center justify-center rounded-full text-[13.5px] font-semibold transition-colors md:size-10 md:text-sm",
        active
          ? "bg-ink font-bold text-white"
          : disabled
            ? "border border-[#DDDFD2] bg-white text-[#B4B7A8]"
            : "border border-[#DDDFD2] bg-white text-ink-soft hover:border-ink"
      )}
    >
      {children}
    </button>
  );
}

/** Circle-pill pagination matching DiecastBD Shop.dc.html (38px mobile / 40px
 * desktop). */
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <Circle label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="size-[15px]" strokeWidth={2} />
      </Circle>

      {pageNumbers.map((num, i) => {
        const prev = pageNumbers[i - 1];
        const showEllipsis = prev != null && num - prev > 1;
        return (
          <span key={num} className="flex items-center gap-2">
            {showEllipsis && <span className="px-0.5 text-sm text-faint">…</span>}
            <Circle active={num === page} onClick={() => onPageChange(num)} label={`Page ${num}`}>
              {num}
            </Circle>
          </span>
        );
      })}

      <Circle label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight className="size-[15px]" strokeWidth={2} />
      </Circle>
    </nav>
  );
}
