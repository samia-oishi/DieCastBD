import { useRouteError } from "react-router";

import { Container } from "@/components/shared/Container";

/** What a customer sees when a route fails to load.
 *
 * Without this, react-router renders its own default screen — the one headed
 * "Unexpected Application Error!" with a stack trace and a note addressed to
 * the developer. That was reaching real shoppers on the live site.
 *
 * The overwhelmingly common cause is a code-split chunk that never arrived: a
 * phone on a weak connection, or the Facebook in-app browser, which is where
 * this was reported. The chunk is usually fine on a second try, so the useful
 * thing to offer is a reload — not an apology.
 */
export function RouteErrorPage() {
  const error = useRouteError();
  const isChunkError = /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
    error?.message ?? ""
  );

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="font-display text-[22px] font-extrabold text-ink md:text-[26px]">
        {isChunkError ? "This page didn't finish loading" : "Something went wrong"}
      </h1>
      <p className="mt-2 max-w-[38ch] text-[14px] text-ink-soft">
        {isChunkError
          ? "It's usually a slow or interrupted connection. Try again — it normally works straight away."
          : "Sorry — that wasn't supposed to happen. Reloading usually clears it."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-ink px-6 py-3 text-[13.5px] font-bold text-white transition-colors hover:bg-ink/90"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-line px-6 py-3 text-[13.5px] font-bold text-ink transition-colors hover:border-ink"
        >
          Go to homepage
        </a>
      </div>
    </Container>
  );
}
