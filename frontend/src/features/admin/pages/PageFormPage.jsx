import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldError, FieldGroup, FieldSeparator } from "@/components/ui/field";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { RichTextEditor } from "./components/RichTextEditor";
import { pageSchema } from "./schemas/pageSchema";
import { useAdminPage, useCreatePageMutation, useUpdatePageMutation } from "./api/useAdminPages";
import { ROUTES } from "@/constants/routes";

export function PageFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: page, isLoading } = useAdminPage(id);
  const createMutation = useCreatePageMutation();
  const updateMutation = useUpdatePageMutation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(pageSchema),
    defaultValues: { title: "", content: "", seo: { title: "", description: "" }, isPublished: false },
  });

  useEffect(() => {
    if (page) reset(page);
  }, [page, reset]);

  if (isEditing && isLoading) return <FullPageLoader />;

  const onSubmit = (values) => {
    const options = {
      onSuccess: () => {
        toast.success(isEditing ? "Page updated" : "Page created");
        if (!isEditing) navigate("..");
      },
      onError: (err) => toast.error(err.response?.data?.message ?? "Could not save page"),
    };

    if (isEditing) {
      updateMutation.mutate({ id, payload: values }, options);
    } else {
      createMutation.mutate(values, options);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-16">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to={`${ROUTES.ADMIN}/pages`}>
          <ChevronLeft /> Back to pages
        </Link>
      </Button>

      <h1 className="font-heading text-2xl">{isEditing ? "Edit page" : "New page"}</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input id="title" {...register("title")} />
            <FieldError errors={errors.title ? [errors.title] : undefined} />
          </Field>

          <Field>
            <FieldLabel>Content</FieldLabel>
            <Controller control={control} name="content" render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />} />
          </Field>

          <Controller
            control={control}
            name="isPublished"
            render={({ field }) => (
              <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Published (visible on the public site)
              </label>
            )}
          />

          <FieldSeparator>SEO</FieldSeparator>
          <Field>
            <FieldLabel htmlFor="seoTitle">SEO title</FieldLabel>
            <Input id="seoTitle" {...register("seo.title")} placeholder={page?.title || "Defaults to the page title"} />
          </Field>
          <Field>
            <FieldLabel htmlFor="seoDescription">SEO description</FieldLabel>
            <Textarea id="seoDescription" rows={2} {...register("seo.description")} />
          </Field>

          <Button type="submit" disabled={isSubmitting} className="w-fit">
            {isSubmitting ? "Saving..." : "Save page"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
