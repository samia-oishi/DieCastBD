import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Field, FieldLabel, FieldError, FieldGroup, FieldSeparator } from "@/components/ui/field";
import { useBrands } from "@/features/admin/catalog/api/useBrands";
import { useCategories } from "@/features/admin/catalog/api/useCategories";
import { productSchema } from "../schemas/productSchema";
import { ROUTES } from "@/constants/routes";

const emptyToUndefined = (value) => (value === "" ? undefined : value);

// Same yyyy-mm-dd <-> ISO convention as CouponsPage.jsx's expiresAt field.
const toDateInputValue = (dateString) => (dateString ? new Date(dateString).toISOString().slice(0, 10) : "");

export function ProductForm({ product, onSubmit, isSubmitting }) {
  const navigate = useNavigate();
  const brands = useBrands();
  const categories = useCategories();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          ...product,
          brand: product.brand?._id ?? product.brand,
          category: product.category?.map((c) => c._id ?? c) ?? [],
          salePrice: product.salePrice ?? "",
          costPrice: product.costPrice ?? "",
          preOrderStartDate: toDateInputValue(product.preOrderStartDate),
          preOrderEndDate: toDateInputValue(product.preOrderEndDate),
        }
      : {
          sku: "",
          title: "",
          brand: "",
          category: [],
          status: "draft",
          stock: 0,
          price: 0,
        },
  });

  const submit = (values) => {
    const payload = {
      ...values,
      salePrice: emptyToUndefined(values.salePrice),
      costPrice: emptyToUndefined(values.costPrice),
      preOrderStartDate: values.preOrderStartDate ? new Date(values.preOrderStartDate).toISOString() : null,
      preOrderEndDate: values.preOrderEndDate ? new Date(values.preOrderEndDate).toISOString() : null,
    };
    onSubmit(payload, {
      onSuccess: () => {
        toast.success(product ? "Product updated" : "Product created");
        if (!product) navigate(ROUTES.ADMIN + "/products");
      },
      onError: (err) => toast.error(err.response?.data?.message ?? "Something went wrong"),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.sku}>
            <FieldLabel htmlFor="sku">SKU</FieldLabel>
            <Input id="sku" {...register("sku")} />
            <FieldError errors={errors.sku ? [errors.sku] : undefined} />
          </Field>
          <Field data-invalid={!!errors.status}>
            <FieldLabel>Status</FieldLabel>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <Field data-invalid={!!errors.title}>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input id="title" {...register("title")} />
          <FieldError errors={errors.title ? [errors.title] : undefined} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.brand}>
            <FieldLabel>Brand</FieldLabel>
            <Controller
              control={control}
              name="brand"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.list.data?.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={errors.brand ? [errors.brand] : undefined} />
          </Field>
          <Field>
            <FieldLabel>Category</FieldLabel>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value?.[0] ?? ""} onValueChange={(v) => field.onChange([v])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.list.data?.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field>
            <FieldLabel htmlFor="series">Series</FieldLabel>
            <Input id="series" {...register("series")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="modelNumber">Model number</FieldLabel>
            <Input id="modelNumber" {...register("modelNumber")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="manufacturer">Manufacturer</FieldLabel>
            <Input id="manufacturer" {...register("manufacturer")} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field>
            <FieldLabel htmlFor="scale">Scale</FieldLabel>
            <Input id="scale" placeholder="1:64" {...register("scale")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="material">Material</FieldLabel>
            <Input id="material" {...register("material")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="color">Color</FieldLabel>
            <Input id="color" {...register("color")} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea id="description" rows={4} {...register("description")} />
        </Field>

        <FieldSeparator>Pricing &amp; stock</FieldSeparator>

        <div className="grid grid-cols-4 gap-4">
          <Field data-invalid={!!errors.price}>
            <FieldLabel htmlFor="price">Price (৳)</FieldLabel>
            <Input id="price" type="number" step="1" {...register("price")} />
            <FieldError errors={errors.price ? [errors.price] : undefined} />
          </Field>
          <Field>
            <FieldLabel htmlFor="salePrice">Sale price (৳)</FieldLabel>
            <Input id="salePrice" type="number" step="1" {...register("salePrice")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="costPrice">Cost price (৳)</FieldLabel>
            <Input id="costPrice" type="number" step="1" {...register("costPrice")} />
          </Field>
          <Field data-invalid={!!errors.stock}>
            <FieldLabel htmlFor="stock">Stock</FieldLabel>
            <Input id="stock" type="number" {...register("stock")} />
            <FieldError errors={errors.stock ? [errors.stock] : undefined} />
          </Field>
        </div>

        <FieldSeparator>Merchandising</FieldSeparator>

        <div className="flex gap-8">
          <Field orientation="horizontal">
            <FieldLabel htmlFor="isFeatured">Featured</FieldLabel>
            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => (
                <Switch id="isFeatured" checked={!!field.value} onCheckedChange={field.onChange} />
              )}
            />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="isHeroProduct">Hero product</FieldLabel>
            <Controller
              control={control}
              name="isHeroProduct"
              render={({ field }) => (
                <Switch id="isHeroProduct" checked={!!field.value} onCheckedChange={field.onChange} />
              )}
            />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="isNewArrival">New arrival</FieldLabel>
            <Controller
              control={control}
              name="isNewArrival"
              render={({ field }) => (
                <Switch id="isNewArrival" checked={!!field.value} onCheckedChange={field.onChange} />
              )}
            />
          </Field>
        </div>

        <FieldSeparator>Pre-order</FieldSeparator>

        <div className="flex flex-wrap items-end gap-4">
          <Field orientation="horizontal">
            <FieldLabel htmlFor="isPreOrder">Pre-order product</FieldLabel>
            <Controller
              control={control}
              name="isPreOrder"
              render={({ field }) => (
                <Switch id="isPreOrder" checked={!!field.value} onCheckedChange={field.onChange} />
              )}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="preOrderStartDate">Pre-order start date</FieldLabel>
            <Input id="preOrderStartDate" type="date" {...register("preOrderStartDate")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="preOrderEndDate">Pre-order end date (optional)</FieldLabel>
            <Input id="preOrderEndDate" type="date" {...register("preOrderEndDate")} />
            <FieldError errors={errors.preOrderEndDate ? [errors.preOrderEndDate] : undefined} />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
