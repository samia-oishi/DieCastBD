import { useState } from "react";
import { Download } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useAdminSubscribers } from "./api/useAdminNewsletter";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function downloadCsv(subscribers) {
  const header = ["Email", "Subscribed At"];
  const lines = subscribers.map((s) => [s.email, s.subscribedAt].join(","));
  const csv = [header.join(","), ...lines].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "diecastbd-newsletter-subscribers.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function NewsletterPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useAdminSubscribers({ page, limit: 50, q: debouncedSearch || undefined });
  const subscribers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Newsletter Subscribers</h1>
        <Button variant="outline" size="sm" disabled={!subscribers.length} onClick={() => downloadCsv(subscribers)}>
          <Download /> Export CSV
        </Button>
      </div>

      <Input
        placeholder="Search email..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-xs"
      />

      <p className="text-sm text-muted-foreground">{meta?.total ?? 0} active subscribers</p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Subscribed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && subscribers.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                No subscribers yet.
              </TableCell>
            </TableRow>
          )}
          {subscribers.map((s) => (
            <TableRow key={s._id}>
              <TableCell>{s.email}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(s.subscribedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
