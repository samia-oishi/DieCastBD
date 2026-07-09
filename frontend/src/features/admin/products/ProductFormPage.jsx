import { useParams, Link } from "react-router";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
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
    if (isEditing) {
      updateMutation.mutate({ id, payload }, callbacks);
    } else {
      createMutation.mutate(payload, callbacks);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-16">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="..">
          <ChevronLeft /> Back to products
        </Link>
      </Button>

      <h1 className="font-heading text-2xl">{isEditing ? "Edit product" : "New product"}</h1>

      {isEditing && product && (
        <div className="rounded-lg border border-border p-4">
          <ProductImageManager product={product} />
        </div>
      )}

      <ProductForm
        product={product}
        onSubmit={onSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
