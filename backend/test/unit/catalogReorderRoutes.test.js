import { describe, it, expect } from "vitest";
import { adminRouter as brandAdminRouter } from "../../src/modules/brands/brand.routes.js";
import { adminRouter as categoryAdminRouter } from "../../src/modules/categories/category.routes.js";

/** The PATCH paths a router declares, in declaration order. */
function patchPaths(router) {
  return router.stack
    .filter((layer) => layer.route?.methods?.patch)
    .map((layer) => layer.route.path);
}

describe.each([
  ["brands", brandAdminRouter],
  ["categories", categoryAdminRouter],
])("%s admin router", (_name, router) => {
  // Express matches in declaration order. Declared the other way round,
  // PATCH /reorder is read as PATCH /:id with id="reorder" — which doesn't
  // error, it just silently fails to save the merchant's order.
  it("declares /reorder before /:id", () => {
    const paths = patchPaths(router);
    expect(paths).toContain("/reorder");
    expect(paths.indexOf("/reorder")).toBeLessThan(paths.indexOf("/:id"));
  });
});
