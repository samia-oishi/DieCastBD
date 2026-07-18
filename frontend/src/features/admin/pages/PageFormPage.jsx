import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { slugify } from "@/lib/slug";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { SectionPanel } from "@/features/admin/shell/SectionPanel";
import { SaveBar } from "@/features/admin/shell/SaveBar";
import { adminToast } from "@/features/admin/shell/adminToast";
import { adminInputCls, adminTextareaCls } from "@/features/admin/shell/adminFieldCls";
import { RichTextEditor } from "./components/RichTextEditor";
import { BlockCanvas } from "./components/BlockCanvas";
import { pageSchema } from "./schemas/pageSchema";
import { useAdminPage, useCreatePageMutation, useUpdatePageMutation } from "./api/useAdminPages";

const BLANK = { title: "", content: "", blocks: [], seo: { title: "", description: "" }, isPublished: false };

function toFormValues(page) {
  return {
    title: page.title ?? "",
    content: page.content ?? "",
    blocks: page.blocks ?? [],
    seo: { title: page.seo?.title ?? "", description: page.seo?.description ?? "" },
    isPublished: !!page.isPublished,
  };
}

export function PageFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: page, isLoading } = useAdminPage(id);
  const createMutation = useCreatePageMutation();
  const updateMutation = useUpdatePageMutation();

  const [legacyOpen, setLegacyOpen] = useState(false);

  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm({
    resolver: zodResolver(pageSchema),
    defaultValues: BLANK,
    values: page ? toFormValues(page) : undefined,
  });

  if (isEditing && isLoading) return <FullPageLoader />;

  const title = watch("title");
  const slugPreview = slugify(title) || page?.slug || "";

  const onSubmit = (values) => {
    const options = {
      onSuccess: (saved) => {
        adminToast(isEditing ? "Page saved" : "Page created");
        if (isEditing) reset(values);
        else navigate(`${ROUTES.ADMIN}/pages/${saved._id}`);
      },
      onError: (err) => adminToast(err.response?.data?.message ?? "Could not save page"),
    };
    if (isEditing) updateMutation.mutate({ id, payload: values }, options);
    else createMutation.mutate(values, options);
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[18px] pb-24">
      <div>
        <Link
          to={`${ROUTES.ADMIN}/pages`}
          className="-ml-2.5 flex w-fit items-center gap-1.5 rounded-full px-2.5 py-2 text-[13px] font-semibold text-ink-soft hover:bg-tile hover:text-ink"
        >
          <ChevronLeft size={15} strokeWidth={2} /> Back to pages
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[24px] font-extrabold tracking-[-0.015em] text-ink md:text-[30px]">
            {isEditing ? page?.title || "Edit page" : "New page"}
          </h1>
          {isEditing && page?.isPublished && (
            <a href={`/${page.slug}`} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-brand-deep hover:text-ink">
              View live ↗
            </a>
          )}
        </div>
      </div>

      <SectionPanel>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Title</span>
            <input {...register("title")} placeholder="e.g. Eid Mega Sale" className={adminInputCls} />
            {errors.title && <span className="mt-1 block text-[11.5px] text-[#B3261E]">{errors.title.message}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">
              Slug <span className="font-normal text-faint">(from the title)</span>
            </span>
            {/* Read-only on purpose: the server derives the slug from the title,
                so an editable field here would just be ignored on save. */}
            <input value={slugPreview ? `/${slugPreview}` : ""} readOnly tabIndex={-1} className={cn(adminInputCls, "bg-[#FCFCF9] text-ink-soft")} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">Status</span>
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <select
                  value={field.value ? "Published" : "Draft"}
                  onChange={(e) => field.onChange(e.target.value === "Published")}
                  className={cn(adminInputCls, "cursor-pointer")}
                >
                  <option>Published</option>
                  <option>Draft</option>
                </select>
              )}
            />
          </label>
        </div>
      </SectionPanel>

      <Controller
        control={control}
        name="blocks"
        render={({ field }) => (
          <BlockCanvas
            blocks={field.value ?? []}
            onChange={(next) => field.onChange(next)}
          />
        )}
      />

      {/* The Tiptap editor still owns every page that's live today, so it stays
          — folded away, since new pages are meant to be built from blocks. */}
      <SectionPanel className="overflow-hidden" bodyClassName="p-0">
        <button
          type="button"
          onClick={() => setLegacyOpen((v) => !v)}
          aria-expanded={legacyOpen}
          className="flex w-full items-center justify-between gap-3 px-[22px] py-4 text-left"
        >
          <span>
            <span className="block font-display text-[15.5px] font-bold text-ink">Page content</span>
            <span className="mt-0.5 block text-[12.5px] text-[#6B6E60]">
              The rich-text body used by the pages that are live today. This is what saves and renders.
            </span>
          </span>
          <ChevronDown size={17} strokeWidth={2} className={cn("shrink-0 text-faint transition-transform", legacyOpen && "rotate-180")} />
        </button>
        {legacyOpen && (
          <div className="border-t border-line-soft px-[22px] py-4">
            <Controller control={control} name="content" render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />} />
          </div>
        )}
      </SectionPanel>

      <SectionPanel title="SEO" description="Blank fields fall back to the page title and the store's default description.">
        <div className="grid gap-3.5">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">SEO title</span>
            <input {...register("seo.title")} placeholder="Defaults to the page title" className={adminInputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink">SEO description</span>
            <textarea {...register("seo.description")} rows={3} className={adminTextareaCls} />
          </label>
        </div>
      </SectionPanel>

      <SaveBar
        dirty={isDirty || !isEditing}
        saving={saving}
        onDiscard={() => reset()}
        saveLabel={isEditing ? "Save page" : "Create page"}
      />
    </form>
  );
}
