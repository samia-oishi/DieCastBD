import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Pencil, Trash2, ImageUp, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slug";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AdminPageHeader } from "@/features/admin/shell/AdminPageHeader";
import { AdminButton } from "@/features/admin/shell/AdminButton";
import { AdminModal } from "@/features/admin/shell/AdminModal";
import { adminToast } from "@/features/admin/shell/adminToast";
import { adminInputCls, adminTextareaCls } from "@/features/admin/shell/adminFieldCls";
import { catalogItemSchema } from "../schemas/catalogSchemas";

const GRID = "md:grid-cols-[52px_minmax(160px,1fr)_minmax(140px,1fr)_90px_90px_110px]";

function initials(name) {
  return (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function LogoTile({ item, imageField }) {
  const url = item[imageField]?.url;
  return url ? (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-line bg-white">
      <img src={url} alt="" className="size-full object-contain" />
    </span>
  ) : (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-line-soft bg-tile font-display text-[12px] font-extrabold text-[#6B6E60]">
      {initials(item.name)}
    </span>
  );
}

function IconAction({ label, icon: Icon, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-[30px] items-center justify-center rounded-[9px] border border-line bg-white text-[#6B6E60] transition-colors",
        danger ? "hover:border-[#F0C9C5] hover:bg-[#FDF6F5] hover:text-danger" : "hover:border-ink hover:text-ink"
      )}
    >
      <Icon size={14} strokeWidth={2} />
    </button>
  );
}

/**
 * List + create/edit modal + delete confirm + logo upload, shared by the Brands
 * and Categories screens — their CRUD shape is identical; only the resource hook
 * and the image field name differ.
 */
export function SimpleCatalogManager({ title, singular, resource, imageField = "logo", productFilterKey }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(catalogItemSchema), defaultValues: { name: "", description: "", sortOrder: 0 } });

  const nameValue = watch("name");

  const openCreate = () => {
    setEditingItem(null);
    reset({ name: "", description: "", sortOrder: 0 });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    reset({ name: item.name, description: item.description ?? "", sortOrder: item.sortOrder ?? 0 });
    setModalOpen(true);
  };

  const onSubmit = (values) => {
    const mutation = editingItem
      ? resource.update.mutateAsync({ id: editingItem._id, payload: values })
      : resource.create.mutateAsync(values);

    mutation
      .then(() => {
        adminToast(editingItem ? `${singular} updated` : `${singular} created`);
        setModalOpen(false);
      })
      .catch((err) => adminToast(err.response?.data?.message ?? "Something went wrong"));
  };

  const onDelete = () => {
    resource.remove
      .mutateAsync(deletingItem._id)
      .then(() => {
        adminToast(`${singular} deleted`);
        setDeletingItem(null);
      })
      .catch((err) => adminToast(err.response?.data?.message ?? "Could not delete"));
  };

  const onToggleActive = (item) => {
    resource.update.mutate(
      { id: item._id, payload: { isActive: !item.isActive } },
      { onError: (err) => adminToast(err.response?.data?.message ?? "Could not update") }
    );
  };

  const onUploadImage = (item, file) => {
    if (!file) return;
    resource.uploadImage
      .mutateAsync({ id: item._id, file })
      .then(() => adminToast("Image updated"))
      .catch(() => adminToast("Upload failed"));
  };

  const items = resource.list.data ?? [];

  return (
    <div className="flex flex-col gap-[18px]">
      <AdminPageHeader
        eyebrow={`${items.length} ${items.length === 1 ? singular.toLowerCase() : title.toLowerCase()}`}
        title={title}
        actions={
          <AdminButton onClick={openCreate}>
            <Plus size={16} strokeWidth={2.4} /> Add {singular.toLowerCase()}
          </AdminButton>
        }
      />

      <section className="overflow-x-auto rounded-[18px] border border-line bg-white">
        <div className="md:min-w-[780px]">
          <div className={cn("hidden items-center gap-3 border-b border-line-soft px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-faint md:grid", GRID)}>
            <span />
            <span>Name</span>
            <span>Slug</span>
            <span className="text-right">Products</span>
            <span>Active</span>
            <span className="text-right">Actions</span>
          </div>

          {resource.list.isLoading && <p className="px-5 py-10 text-center text-[13.5px] text-faint">Loading…</p>}
          {!resource.list.isLoading && items.length === 0 && (
            <p className="px-5 py-10 text-center text-[13.5px] text-faint">
              No {title.toLowerCase()} yet — add your first one.
            </p>
          )}

          {items.map((item) => (
            <div
              key={item._id}
              className={cn(
                "grid grid-cols-[52px_1fr] items-center gap-3 border-b border-line-soft px-4 py-3 last:border-b-0 md:px-5 md:py-2.5",
                GRID
              )}
            >
              <label className="cursor-pointer" title="Replace image">
                <LogoTile item={item} imageField={imageField} />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                  className="hidden"
                  onChange={(e) => onUploadImage(item, e.target.files?.[0])}
                />
              </label>

              {/* desktop cells */}
              <div className="hidden md:contents">
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-ink">{item.name}</span>
                  {item.description && <span className="block truncate text-[11.5px] text-faint">{item.description}</span>}
                </span>
                <span className="truncate text-[12px] text-faint">{item.slug}</span>
                <span className="text-right">
                  {item.productCount > 0 ? (
                    <Link
                      to={`${ROUTES.ADMIN}/products?${productFilterKey}=${item.slug}`}
                      className="text-[12.5px] font-bold text-ink hover:text-brand-deep"
                    >
                      {item.productCount}
                    </Link>
                  ) : (
                    <span className="text-[12.5px] font-bold text-faint">0</span>
                  )}
                </span>
                <span>
                  <Switch checked={item.isActive} onCheckedChange={() => onToggleActive(item)} aria-label={`${item.name} active`} />
                </span>
                <span className="flex justify-end gap-1.5">
                  <IconAction label={`Edit ${item.name}`} icon={Pencil} onClick={() => openEdit(item)} />
                  <IconAction label={`Delete ${item.name}`} icon={Trash2} danger onClick={() => setDeletingItem(item)} />
                </span>
              </div>

              {/* mobile row */}
              <div className="flex items-center gap-3 md:hidden">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-ink">{item.name}</div>
                  <div className="truncate text-[11.5px] text-faint">
                    {item.slug} · {item.productCount ?? 0} products
                  </div>
                </div>
                <Switch checked={item.isActive} onCheckedChange={() => onToggleActive(item)} aria-label={`${item.name} active`} />
                <IconAction label={`Edit ${item.name}`} icon={Pencil} onClick={() => openEdit(item)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[12px] leading-[1.6] text-faint">
        Turning one off hides it from the storefront menus but keeps its products. Deleting one doesn&apos;t delete
        products — they simply lose this {singular.toLowerCase()}.
      </p>

      {modalOpen && (
        <AdminModal
          title={editingItem ? `Edit ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}
          onClose={() => setModalOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <AdminButton type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</AdminButton>
              <AdminButton type="submit" form="catalog-form" disabled={resource.create.isPending || resource.update.isPending}>
                {resource.create.isPending || resource.update.isPending ? "Saving…" : "Save"}
              </AdminButton>
            </div>
          }
        >
          <form id="catalog-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
            {editingItem && (
              <div className="flex items-center gap-3 rounded-[12px] border border-line-soft bg-[#FCFCF9] p-3">
                <LogoTile item={editingItem} imageField={imageField} />
                <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft hover:text-ink">
                  <ImageUp size={15} strokeWidth={2} />
                  {resource.uploadImage.isPending ? "Uploading…" : "Replace image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                    className="hidden"
                    onChange={(e) => onUploadImage(editingItem, e.target.files?.[0])}
                  />
                </label>
              </div>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold text-ink">Name</span>
              <Input className={adminInputCls} {...register("name")} placeholder="MINI GT" />
              {errors.name && <span className="text-[11.5px] text-danger">{errors.name.message}</span>}
            </label>

            {/* The server derives the slug from the name (slugify on create and on
                rename), so this is a read-only preview rather than a field that
                pretends to be editable. */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold text-ink">Slug</span>
              <Input
                className={cn(adminInputCls, "bg-[#FCFCF9] text-faint")}
                value={slugify(nameValue) || (editingItem?.slug ?? "")}
                readOnly
                tabIndex={-1}
              />
              <span className="text-[11.5px] text-faint">Generated from the name — used in storefront links.</span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold text-ink">Description</span>
              <Textarea rows={3} className={adminTextareaCls} {...register("description")} />
              <span className="text-[11.5px] text-faint">
                Shown as the intro paragraph on the {singular.toLowerCase()}&apos;s landing page — good place for the
                words customers actually search. Left out entirely when blank.
              </span>
            </label>

            <label className="flex w-40 flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold text-ink">Sort order</span>
              <Input type="number" className={adminInputCls} {...register("sortOrder")} />
            </label>
          </form>
        </AdminModal>
      )}

      <AlertDialog open={!!deletingItem} onOpenChange={(v) => !v && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingItem?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingItem?.productCount > 0
                ? `${deletingItem.productCount} product${deletingItem.productCount === 1 ? "" : "s"} will keep existing but lose this ${singular.toLowerCase()}.`
                : `This ${singular.toLowerCase()} isn't used by any product.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resource.remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              disabled={resource.remove.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {resource.remove.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
