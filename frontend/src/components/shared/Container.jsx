import { cn } from "@/lib/utils";

const MAX_WIDTHS = {
  // Redesign default: 1360px content + a persistent 40px desktop gutter
  // (md:px-10), matching the design references' `max-width:1360px;padding:0 40px`.
  default: "max-w-[1360px]",
  narrow: "max-w-3xl",
};

/** The one place page-width + horizontal padding is defined — every section
 * must use this instead of hand-rolling `mx-auto max-w-* px-*`, or subtle
 * nesting differences cause misaligned left/right edges between sections on
 * wide viewports (padding-inside-max-width vs padding-outside-max-width are
 * not the same thing once the max-width is actually reached). Mobile gutter is
 * 16px (px-4); desktop is 40px (md:px-10) per the design. */
export function Container({ size = "default", className, children, ...props }) {
  return (
    <div className={cn("mx-auto w-full px-4 md:px-10", MAX_WIDTHS[size], className)} {...props}>
      {children}
    </div>
  );
}
