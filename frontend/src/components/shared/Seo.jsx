import { Helmet } from "react-helmet-async";

const SITE_NAME = "DiecastBD";
const DEFAULT_TITLE = "Hot Wheels, MINI GT & Diecast Cars in Bangladesh | DiecastBD";
const DEFAULT_DESCRIPTION =
  "Buy authentic Hot Wheels Premium and MINI GT diecast cars in Bangladesh. Verified 1:64 collectibles, collector-grade packaging, and nationwide delivery.";

/** One Helmet wrapper for every storefront page. Pass a page `title` (appended as
 * "… | DiecastBD" unless `noTemplate`) and optional `description`; omit both for
 * the site defaults from README §Interactions. */
export function Seo({ title, description = DEFAULT_DESCRIPTION, noTemplate = false, children }) {
  const fullTitle = !title ? DEFAULT_TITLE : noTemplate ? title : `${title} | ${SITE_NAME}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {children}
    </Helmet>
  );
}
