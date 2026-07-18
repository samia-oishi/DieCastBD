import { useParams, Link } from "react-router";
import { ChevronLeft } from "lucide-react";

import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { SectionPanel } from "@/features/admin/shell/SectionPanel";
import { ProductForm } from "./components/ProductForm";
import { ProductImageManager } from "./components/ProductImageManager";
import { useAdminProduct, useCreateProductMutation, useUpdateProductMutation } from "./api/useProducts";

export function ProductFormPage() {
  const { id } = useParams();
  const isEditing = !!id;

  const { data: product, isLoading } = useAdminProduct(id);
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();

  if (isEditing && isLoading) return <FullPageLoader />;

  const onSubmit = (payload, callbacks) => {
    if (isEditing) updateMutation.mutate({ id, payload }, callbacks);
    else createMutation.mutate(payload, callbacks);
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <Link to=".." className="flex w-fit items-center gap-1 text-[13px] font-semibold text-ink-soft hover:text-ink">
        <ChevronLeft size={17} strokeWidth={2.2} /> Back to products
      </Link>

      <AdminPageHeader
        eyebrow={isEditing ? product?.sku : "Catalogue"}
        title={isEditing ? "Edit product" : "New product"}
      />

      {/* Photos only exist once the product does — uploads post to /:id/thumbnail
          and /:id/gallery, so on create this panel appears after the first save. */}
      {isEditing && product && (
        <SectionPanel title="Photos" description="First image is the cover shown across the storefront." bodyClassName="pt-3">
          <ProductImageManager product={product} />
        </SectionPanel>
      )}

      <ProductForm
        product={product}
        onSubmit={onSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
