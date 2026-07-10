import { Link } from "react-router";
import { Plus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useAdminPages } from "./api/useAdminPages";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function PagesPage() {
  const { data: pages, isLoading } = useAdminPages();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Pages</h1>
        <Button asChild size="sm">
          <Link to="new">
            <Plus /> New Page
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && pages?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No pages yet.
              </TableCell>
            </TableRow>
          )}
          {pages?.map((page) => (
            <TableRow key={page._id}>
              <TableCell className="font-medium">{page.title}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">/{page.slug}</TableCell>
              <TableCell>
                {page.isPublished ? (
                  <Badge className="bg-primary text-primary-foreground">Published</Badge>
                ) : (
                  <Badge variant="outline">Draft</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(page.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon-sm" aria-label="Edit page" asChild>
                  <Link to={page._id}>
                    <Pencil />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
