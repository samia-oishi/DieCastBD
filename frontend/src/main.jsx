import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { AppProviders } from "./app/providers/AppProviders";
import { router } from "./app/router";
import "./index.css";

/** Hand the <head> over from the baked snapshot to React.
 *
 * scripts/prerender.mjs bakes per-route title/description/canonical/og/JSON-LD
 * into the HTML so JS-blind crawlers (Facebook, WhatsApp, LinkedIn) and
 * Google's pre-render pass see real metadata. react-helmet-async v3 on React 19
 * renders its tags as ordinary elements that React APPENDS to <head> — it never
 * removes what is already there. Without this line every prerendered route
 * would end up with two <title>s, two canonicals and duplicate Product JSON-LD
 * in the rendered DOM, which is exactly the ambiguity the prerender exists to
 * remove.
 *
 * Running it before the first render means the baked tags are gone by the time
 * React's own are in place, and React's are always the live ones (current
 * price, current stock).
 */
document.querySelectorAll("[data-prerendered]").forEach((el) => el.remove());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
);
