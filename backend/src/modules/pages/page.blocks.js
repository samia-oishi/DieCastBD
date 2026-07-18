import { z } from "zod";

/** Block schema for the Pages builder.
 *
 * Blocks are structured data, never HTML — the storefront renders them as React
 * elements, so there is no `dangerouslySetInnerHTML` path and nothing to strip.
 * That's deliberate: page `content` needs sanitize-html precisely because it IS
 * markup, and this schema exists so blocks never join it in that category.
 *
 * The shapes mirror `frontend/src/features/admin/pages/blockTypes.js` exactly.
 * Zod is `.strict()` per block so a stray field is a 400 rather than something
 * that silently rides along into the database.
 */

const WIDTH = z.enum(["Full", "Half"]).default("Full");

/** Rejects `javascript:` and other script-bearing schemes.
 *
 * Blocks store links the storefront puts in href/src. Allowing only relative
 * paths and http(s) means a crafted link can't become script execution — and an
 * admin account is not a licence to inject one.
 */
const safeUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === "" || /^(https?:\/\/|\/|#)/i.test(value), {
    message: "Link must be relative (starting with /) or an http(s) URL",
  });

const text = (max) => z.string().trim().max(max);

const blockSchemas = {
  heading: z.object({
    type: z.literal("heading"),
    text: text(200),
    level: z.enum(["H1", "H2", "H3"]).default("H2"),
    width: WIDTH,
  }),
  text: z.object({
    type: z.literal("text"),
    // Markdown source, rendered to React elements — not to HTML.
    text: text(5000),
    width: WIDTH,
  }),
  image: z.object({
    type: z.literal("image"),
    url: safeUrl,
    alt: text(300),
    caption: text(300),
    width: WIDTH,
  }),
  carousel: z.object({
    type: z.literal("carousel"),
    source: z.enum(["Images", "Products"]).default("Images"),
    slides: z.array(safeUrl).max(20).default([]),
    picked: z.array(text(120)).max(50).default([]),
    autoplay: z.boolean().default(false),
    width: WIDTH,
  }),
  products: z.object({
    type: z.literal("products"),
    featured: z.boolean().default(false),
    picked: z.array(text(120)).max(50).default([]),
    columns: z.enum(["2", "3", "4"]).default("3"),
    showPrice: z.boolean().default(true),
    width: WIDTH,
  }),
  button: z.object({
    type: z.literal("button"),
    text: text(80),
    link: safeUrl,
    variant: z.enum(["Lime pill", "Ink outline"]).default("Lime pill"),
    width: WIDTH,
  }),
  offer: z.object({
    type: z.literal("offer"),
    kicker: text(80),
    title: text(160),
    desc: text(300),
    code: text(40),
    theme: z.enum(["Lime", "Dark green", "Ink"]).default("Lime"),
    width: WIDTH,
  }),
  divider: z.object({
    type: z.literal("divider"),
  }),
};

export const blockSchema = z.discriminatedUnion("type", Object.values(blockSchemas).map((s) => s.strict()));

// 60 blocks is far past any real page and still bounds the payload.
export const blocksSchema = z.array(blockSchema).max(60);
