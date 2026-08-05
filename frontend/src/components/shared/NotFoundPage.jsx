import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/shared/Seo";
import { ROUTES } from "@/constants/routes";

/** The 404 surface, reached four ways: the router's `*` catch-all, an unknown
 * `/:slug` (CmsPage), an unknown brand/category (CollectionPage), and a missing
 * product (ProductDetailPage).
 *
 * `noindex` is load-bearing. Vercel's SPA fallback serves every unknown URL
 * with HTTP 200, so Google sees a soft 404 — a real page, as far as the status
 * code is concerned. The rendered `noindex` is what actually keeps mistyped
 * URLs, deleted products and unpublished pages out of the index (plan.md #95).
 *
 * Callers that render this on a *query error* must first confirm the error was
 * a genuine 404 — see PageLoadError.
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <Seo title="Page not found" noindex />
      <h1 className="font-heading text-3xl">Page not found</h1>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Button asChild>
        <Link to={ROUTES.HOME}>Back to home</Link>
      </Button>
    </div>
  );
}
