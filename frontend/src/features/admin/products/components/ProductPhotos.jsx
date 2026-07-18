import { Plus, ImageIcon, X } from "lucide-react";

import { SectionPanel } from "@/features/admin/shell/SectionPanel";
import { adminToast } from "@/features/admin/shell/adminToast";
import {
  useUploadThumbnailMutation,
  useAddGalleryImagesMutation,
  useDeleteGalleryImageMutation,
} from "../api/useProducts";

/** Photos grid, per the prototype: square tiles (auto-fill, min 96px), the first
 * carrying a COVER badge, then a dashed "Add photo" tile.
 *
 * Tile 1 is the product THUMBNAIL (what the storefront shows as the cover);
 * the rest are gallery images. Clicking the cover replaces it; the dashed tile
 * appends gallery images. Uploads post to /:id/... so they need a saved product.
 */
export function ProductPhotos({ product }) {
  const uploadThumbnail = useUploadThumbnailMutation();
  const addGallery = useAddGalleryImagesMutation();
  const deleteGallery = useDeleteGalleryImageMutation();

  const saved = !!product?._id;
  const gallery = product?.gallery ?? [];

  const onThumb = (file) => {
    if (!file) return;
    uploadThumbnail.mutate(
      { id: product._id, file },
      { onSuccess: () => adminToast("Cover photo updated"), onError: () => adminToast("Upload failed") }
    );
  };

  const onAdd = (files) => {
    if (!files?.length) return;
    addGallery.mutate(
      { id: product._id, files: Array.from(files) },
      { onSuccess: () => adminToast("Photos added"), onError: () => adminToast("Upload failed") }
    );
  };

  const onRemove = (index) => {
    deleteGallery.mutate(
      { id: product._id, index },
      { onSuccess: () => adminToast("Photo removed"), onError: () => adminToast("Could not remove photo") }
    );
  };

  return (
    <SectionPanel
      title="Photos"
      action={<span className="text-[11.5px] text-faint">First photo is the cover</span>}
      bodyClassName="pt-3.5"
    >
      {!saved ? (
        <p className="rounded-[12px] border border-dashed border-[#DEDFD6] px-4 py-6 text-center text-[12.5px] text-faint">
          Save the product first — photos upload straight to it.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2.5">
          {/* cover = thumbnail */}
          <label
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-[12px] border border-brand-soft-border bg-tile"
            title="Replace cover photo"
          >
            {product.thumbnail?.url ? (
              <img src={product.thumbnail.url} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-faint">
                <ImageIcon size={22} strokeWidth={1.6} />
              </span>
            )}
            <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-[7px] py-[3px] text-[8.5px] font-extrabold tracking-[0.06em] text-white">
              COVER
            </span>
            <span className="absolute inset-0 hidden items-center justify-center bg-[rgba(16,18,8,0.45)] text-[11px] font-semibold text-white group-hover:flex">
              {uploadThumbnail.isPending ? "Uploading…" : "Replace"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={(e) => onThumb(e.target.files?.[0])}
            />
          </label>

          {gallery.map((image, index) => (
            <div key={image.cloudinaryId ?? index} className="group relative aspect-square overflow-hidden rounded-[12px] border border-line-soft bg-tile">
              <img src={image.url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label="Remove photo"
                className="absolute right-1.5 top-1.5 hidden size-6 items-center justify-center rounded-full bg-[rgba(16,18,8,0.7)] text-white group-hover:flex hover:bg-danger"
              >
                <X size={13} strokeWidth={2.4} />
              </button>
            </div>
          ))}

          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[12px] border-[1.5px] border-dashed border-[#DEDFD6] text-[11px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink">
            <Plus size={16} strokeWidth={2} />
            {addGallery.isPending ? "Uploading…" : "Add photo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              multiple
              className="hidden"
              onChange={(e) => onAdd(e.target.files)}
            />
          </label>
        </div>
      )}
    </SectionPanel>
  );
}
