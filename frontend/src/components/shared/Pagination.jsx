import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function getPageNumbers(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft />
      </Button>

      {pageNumbers.map((num, i) => {
        const prev = pageNumbers[i - 1];
        const showEllipsis = prev != null && num - prev > 1;
        return (
          <span key={num} className="flex items-center gap-1">
            {showEllipsis && <span className="px-1 text-sm text-muted-foreground">…</span>}
            <Button
              variant={num === page ? "default" : "outline"}
              size="icon-sm"
              onClick={() => onPageChange(num)}
            >
              {num}
            </Button>
          </span>
        );
      })}

      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight />
      </Button>
    </nav>
  );
}
