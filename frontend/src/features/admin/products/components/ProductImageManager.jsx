import toast from "react-hot-toast";
import { Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useUploadThumbnailMutation,
  useAddGalleryImagesMutation,
  useDeleteGalleryImageMutation,
} from "../api/useProducts";

export function ProductImageManager({ product }) {
  const uploadThumbnail = useUploadThumbnailMutation();
  const addGalleryImages = useAddGalleryImagesMutation();
  const deleteGalleryImage = useDeleteGalleryImageMutation();

  const onThumbnailSelected = (file) => {
    if (!file) return;
    toast.promise(uploadThumbnail.mutateAsync({ id: product._id, file }), {
      loading: "Uploading thumbnail...",
      success: "Thumbnail updated",
      error: "Upload failed",
    });
  };

  const onGallerySelected = (files) => {
    if (!files?.length) return;
    toast.promise(addGalleryImages.mutateAsync({ id: product._id, files: Array.from(files) }), {
      loading: "Uploading images...",
      success: "Gallery updated",
      error: "Upload failed",
    });
  };

  const onDeleteGalleryImage = (index) => {
    toast.promise(deleteGalleryImage.mutateAsync({ id: product._id, index }), {
      loading: "Removing...",
      success: "Image removed",
      error: "Could not remove image",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 text-sm font-medium">Thumbnail</h3>
        <div className="flex items-center gap-4">
          {product.thumbnail?.url ? (
            <img src={product.thumbnail.url} alt="" className="size-24 rounded-lg border border-border object-cover" />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              No image
            </div>
          )}
          <Button variant="outline" size="sm" asChild disabled={uploadThumbnail.isPending}>
            <label>
              <Upload /> {product.thumbnail ? "Replace" : "Upload"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={(e) => onThumbnailSelected(e.target.files?.[0])}
              />
            </label>
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">Gallery</h3>
          <Button variant="outline" size="sm" asChild disabled={addGalleryImages.isPending}>
            <label>
              <Upload /> Add images
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                multiple
                className="hidden"
                onChange={(e) => onGallerySelected(e.target.files)}
              />
            </label>
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {product.gallery?.length === 0 && (
            <p className="text-sm text-muted-foreground">No gallery images yet.</p>
          )}
          {product.gallery?.map((image, index) => (
            <div key={image.cloudinaryId} className="group relative">
              <img src={image.url} alt="" className="size-20 rounded-lg border border-border object-cover" />
              <button
                type="button"
                onClick={() => onDeleteGalleryImage(index)}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
