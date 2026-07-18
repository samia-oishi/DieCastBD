import { CarFront } from "lucide-react";

import { cn } from "@/lib/utils";

/** Product/entity thumbnail for admin list rows.
 *
 * Images FILL the tile height and are centre-cropped horizontally
 * (`h-full w-auto max-w-none` inside an `overflow-hidden` box) — the same
 * treatment the storefront ProductCard uses, so a product looks identical in
 * admin and on the shop. `object-contain` would letterbox instead, which is what
 * made these read as small floating stamps.
 *
 * Use this for EVERY admin list thumbnail (products, inventory, …) so the
 * treatment stays consistent.
 */
export function AdminThumb({ src, alt = "", size = 44, className, fallback: Fallback = CarFront }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-line bg-white", className)}
    >
      {src ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-auto max-w-none" />
      ) : (
        <Fallback size={Math.round(size * 0.4)} strokeWidth={1.5} className="text-faint" />
      )}
    </div>
  );
}
