import { useState } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
import { useAdminProducts, useDeleteProductMutation } from "./api/useProducts";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 20;

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const { data, isLoading } = useAdminProducts({ page, limit: PAGE_SIZE, q: debouncedSearch || undefined });
  const deleteMutation = useDeleteProductMutation();

  const products = data?.data ?? [];
  const meta = data?.meta;

  const onDelete = () => {
    toast.promise(deleteMutation.mutateAsync(deletingProduct._id), {
      loading: "Deleting...",
      success: () => {
        setDeletingProduct(null);
        return "Product deleted";
      },
      error: "Could not delete product",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Products</h1>
        <Button asChild size="sm">
          <Link to="new">
            <Plus /> Add Product
          </Link>
        </Button>
      </div>

      <Input
        placeholder="Search products..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14"></TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && products.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No products found.
              </TableCell>
            </TableRow>
          )}
          {products.map((product) => (
            <TableRow key={product._id}>
              <TableCell>
                {product.thumbnail?.url ? (
                  <img src={product.thumbnail.url} alt="" className="size-8 rounded object-cover" />
                ) : (
                  <div className="size-8 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell className="font-mono text-xs">{product.sku}</TableCell>
              <TableCell className="font-medium">{product.title}</TableCell>
              <TableCell className="text-muted-foreground">{product.brand?.name}</TableCell>
              <TableCell>৳{product.price.toLocaleString()}</TableCell>
              <TableCell>{product.availableStock}</TableCell>
              <TableCell className="capitalize text-muted-foreground">{product.status}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Edit product" asChild>
                    <Link to={product._id}>
                      <Pencil />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete product" onClick={() => setDeletingProduct(product)}>
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages} ({meta.total} products)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingProduct?.title}?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
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
