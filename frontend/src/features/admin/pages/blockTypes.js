import { Heading, AlignLeft, Image, GalleryHorizontal, Package, RectangleHorizontal, Ticket, Minus } from "lucide-react";

/** Block registry for the page builder.
 *
 * The shape saved per block is `{ type, ...fields }` and a page is
 * `{ title, slug, status, seoTitle, seoDesc, blocks: [] }` — the JSON contract
 * from the handoff, so the eventual backend can take this straight through.
 *
 * `create()` returns a complete block: every field a type can hold is present
 * from the start. A block that grows fields as you touch them makes the summary
 * line and the editors litter themselves with undefined checks.
 */
export const BLOCK_TYPES = {
  heading: {
    label: "Heading",
    icon: Heading,
    create: () => ({ type: "heading", text: "", level: "H2", width: "Full" }),
  },
  text: {
    label: "Text",
    icon: AlignLeft,
    create: () => ({ type: "text", text: "", width: "Full" }),
  },
  image: {
    label: "Image",
    icon: Image,
    create: () => ({ type: "image", url: "", alt: "", caption: "", width: "Full" }),
  },
  carousel: {
    label: "Carousel",
    icon: GalleryHorizontal,
    create: () => ({ type: "carousel", source: "Images", slides: [], picked: [], autoplay: false, width: "Full" }),
  },
  products: {
    label: "Products grid",
    icon: Package,
    create: () => ({ type: "products", featured: false, picked: [], columns: "3", showPrice: true, width: "Full" }),
  },
  button: {
    label: "Button",
    icon: RectangleHorizontal,
    create: () => ({ type: "button", text: "", link: "", variant: "Lime pill", width: "Full" }),
  },
  offer: {
    label: "Offer banner",
    icon: Ticket,
    create: () => ({ type: "offer", kicker: "", title: "", desc: "", code: "", theme: "Lime", width: "Full" }),
  },
  divider: {
    label: "Divider",
    icon: Minus,
    // A hairline has nothing to configure, so it also has no width choice.
    create: () => ({ type: "divider" }),
  },
};

export const PALETTE = Object.entries(BLOCK_TYPES).map(([type, meta]) => ({ type, label: meta.label, icon: meta.icon }));

/** Offer-banner palettes, straight from the design. [background, foreground] */
export const OFFER_THEMES = {
  Lime: ["#C9E469", "#101208"],
  "Dark green": ["#00240c", "#EFF5DC"],
  Ink: ["#101208", "#FAFAF7"],
};

/** Divider has no options at all, so it gets no width control either. */
export function hasWidth(block) {
  return block.type !== "divider";
}

/** The one-line description under each collapsed block's type label. */
export function summarizeBlock(block) {
  switch (block.type) {
    case "heading":
      return `${block.level || "H2"} — ${block.text || "Empty heading"}`;
    case "text":
      return block.text ? block.text.slice(0, 90) : "Empty text block";
    case "image":
      return block.caption || block.alt || "No image uploaded yet";
    case "carousel": {
      const count =
        block.source === "Products"
          ? `${(block.picked ?? []).length} products`
          : `${(block.slides ?? []).length} slides`;
      return `${count} · autoplay ${block.autoplay ? "on" : "off"}`;
    }
    case "products": {
      const picked = block.featured
        ? "All featured products"
        : `${(block.picked ?? []).length || "no"} products picked`;
      return `${picked} · ${block.columns} columns`;
    }
    case "button":
      return `“${block.text || "Button"}” → ${block.link || "/"}`;
    case "offer":
      return `${block.title || "Offer"}${block.code ? ` · code ${block.code}` : ""}`;
    default:
      return "Hairline divider";
  }
}
