import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

/** Shown when a CMS page fails to load for a reason that ISN'T "it doesn't
 * exist" — an API outage, a network blip, a 500.
 *
 * WHY this is separate from NotFoundPage: NotFoundPage now carries
 * `noindex` (plan.md #95). PageView and CmsPage render it on any query error,
 * and `usePage` sets `retry: false` — so without this split, one transient API
 * failure while Googlebot was rendering would paint noindex onto
 * /privacy-policy, /terms-conditions, /refund-policy and /shipping-policy,
 * four legitimately indexed, sitemap-listed pages. A load failure is not a
 * statement about whether the page should be indexed, so this state says
 * nothing to crawlers at all.
 */
export function PageLoadError() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <h1 className="font-heading text-3xl">Couldn't load this page</h1>
      <p className="text-muted-foreground">Something went wrong on our side. Please try again in a moment.</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => window.location.reload()}>Try again</Button>
        <Button asChild variant="outline">
          <Link to={ROUTES.HOME}>Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
