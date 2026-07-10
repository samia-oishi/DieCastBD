import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Pencil, Trash2, ImageUp, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { catalogItemSchema } from "../schemas/catalogSchemas";

/**
 * List + create/edit dialog + delete-confirm + image upload, shared by the
 * Brands and Categories admin pages — their CRUD shape is identical, only the
 * resource hook and image field name differ.
 */
export function SimpleCatalogManager({ title, resource, imageField = "logo" }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(catalogItemSchema) });

  const openCreate = () => {
    setEditingItem(null);
    reset({ name: "", description: "", sortOrder: 0 });
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    reset({ name: item.name, description: item.description ?? "", sortOrder: item.sortOrder ?? 0 });
    setDialogOpen(true);
  };

  const onSubmit = (values) => {
    const mutation = editingItem
      ? resource.update.mutateAsync({ id: editingItem._id, payload: values })
      : resource.create.mutateAsync(values);

    toast.promise(mutation, {
      loading: "Saving...",
      success: () => {
        setDialogOpen(false);
        return editingItem ? `${title.slice(0, -1)} updated` : `${title.slice(0, -1)} created`;
      },
      error: (err) => err.response?.data?.message ?? "Something went wrong",
    });
  };

  const onDelete = () => {
    toast.promise(resource.remove.mutateAsync(deletingItem._id), {
      loading: "Deleting...",
      success: () => {
        setDeletingItem(null);
        return `${title.slice(0, -1)} deleted`;
      },
      error: (err) => err.response?.data?.message ?? "Could not delete",
    });
  };

  const onToggleActive = (item) => {
    resource.update.mutate({ id: item._id, payload: { isActive: !item.isActive } });
  };

  const onImageSelected = (item, file) => {
    if (!file) return;
    toast.promise(resource.uploadImage.mutateAsync({ id: item._id, file }), {
      loading: "Uploading image...",
      success: "Image uploaded",
      error: "Upload failed",
    });
  };

  const items = resource.list.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">{title}</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus /> Add {title.slice(0, -1)}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resource.list.isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!resource.list.isLoading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No {title.toLowerCase()} yet.
              </TableCell>
            </TableRow>
          )}
          {items.map((item) => (
            <TableRow key={item._id}>
              <TableCell>
                {item[imageField]?.url ? (
                  <img src={item[imageField].url} alt={item.name} className="size-8 rounded object-cover" />
                ) : (
                  <div className="size-8 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-muted-foreground">{item.slug}</TableCell>
              <TableCell>
                <Switch checked={item.isActive} onCheckedChange={() => onToggleActive(item)} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Upload image" asChild>
                    <label>
                      <ImageUp />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => onImageSelected(item, e.target.files?.[0])}
                      />
                    </label>
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => openEdit(item)}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => setDeletingItem(item)}>
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" {...register("name")} />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea id="description" rows={3} {...register("description")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="sortOrder">Sort order</FieldLabel>
                <Input id="sortOrder" type="number" {...register("sortOrder")} />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={resource.create.isPending || resource.update.isPending}>
                {editingItem ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingItem?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. Deletion is blocked if any product still references it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
