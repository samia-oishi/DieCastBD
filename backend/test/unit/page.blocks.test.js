import { describe, it, expect } from "vitest";
import { blocksSchema, blockSchema } from "../../src/modules/pages/page.blocks.js";

describe("page block validation", () => {
  it("accepts each of the eight block types", () => {
    const blocks = [
      { type: "heading", text: "Eid Sale", level: "H1", width: "Full" },
      { type: "text", text: "Some **markdown**", width: "Full" },
      { type: "image", url: "/uploads/a.jpg", alt: "a", caption: "", width: "Half" },
      { type: "carousel", source: "Images", slides: ["/a.jpg"], picked: [], autoplay: true, width: "Full" },
      { type: "products", featured: true, picked: [], columns: "4", showPrice: true, width: "Full" },
      { type: "button", text: "Shop", link: "/shop", variant: "Lime pill", width: "Full" },
      { type: "offer", kicker: "K", title: "T", desc: "D", code: "SAVE500", theme: "Ink", width: "Full" },
      { type: "divider" },
    ];
    const result = blocksSchema.safeParse(blocks);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(8);
  });

  it("applies defaults so a half-built block still stores a complete shape", () => {
    const result = blockSchema.safeParse({ type: "products", picked: ["a"] });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ columns: "3", showPrice: true, featured: false, width: "Full" });
  });

  it("rejects a javascript: link — an admin account is not a licence to inject script", () => {
    const result = blockSchema.safeParse({ type: "button", text: "x", link: "javascript:alert(1)" });
    expect(result.success).toBe(false);
  });

  it("rejects a javascript: image url too", () => {
    expect(blockSchema.safeParse({ type: "image", url: "javascript:alert(1)", alt: "", caption: "" }).success).toBe(false);
  });

  it("allows relative, anchor and https links", () => {
    for (const link of ["/shop", "#top", "https://example.com", ""]) {
      expect(blockSchema.safeParse({ type: "button", text: "x", link }).success).toBe(true);
    }
  });

  it("rejects an unknown block type", () => {
    expect(blockSchema.safeParse({ type: "video", url: "/a.mp4" }).success).toBe(false);
  });

  it("rejects unknown fields rather than letting them ride along into the DB", () => {
    expect(blockSchema.safeParse({ type: "divider", onclick: "steal()" }).success).toBe(false);
  });

  it("rejects an invalid enum value", () => {
    expect(blockSchema.safeParse({ type: "heading", text: "x", level: "H7" }).success).toBe(false);
  });

  it("caps the number of blocks on a page", () => {
    const many = Array.from({ length: 61 }, () => ({ type: "divider" }));
    expect(blocksSchema.safeParse(many).success).toBe(false);
  });
});
