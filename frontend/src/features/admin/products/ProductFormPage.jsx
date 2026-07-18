import { useParams, Link } from "react-router";
import { ChevronLeft } from "lucide-react";

import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { ProductForm } from "./components/ProductForm";
import { useAdminProduct, useCreateProductMutation, useUpdateProductMutation } from "./api/useProducts";
import { ROUTES } from "@/constants/routes";

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
      <Link to={`${ROUTES.ADMIN}/products`} className="flex w-fit items-center gap-1 text-[13px] font-semibold text-ink-soft hover:text-ink">
        <ChevronLeft size={17} strokeWidth={2.2} /> Back to products
      </Link>

      <AdminPageHeader
        eyebrow={isEditing ? product?.sku : "Catalogue"}
        title={isEditing ? "Edit product" : "New product"}
      />

      <ProductForm
        product={product}
        onSubmit={onSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
