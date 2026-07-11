import { cn } from "@/lib/utils";

const MAX_WIDTHS = {
  default: "max-w-[1360px]",
  narrow: "max-w-3xl",
};

/** The one place page-width + horizontal padding is defined — every section
 * must use this instead of hand-rolling `mx-auto max-w-* px-*`, or subtle
 * nesting differences cause misaligned left/right edges between sections on
 * wide viewports (padding-inside-max-width vs padding-outside-max-width are
 * not the same thing once the max-width is actually reached). */
export function Container({ size = "default", className, children, ...props }) {
  return (
    <div className={cn("mx-auto px-6 sm:px-10", MAX_WIDTHS[size], className)} {...props}>
      {children}
    </div>
  );
}
