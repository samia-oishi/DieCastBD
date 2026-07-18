import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { BlockRenderer } from "./BlockRenderer";

function renderBlocks(blocks, products = []) {
  return render(
    <MemoryRouter>
      <BlockRenderer blocks={blocks} products={products} />
    </MemoryRouter>
  );
}

describe("BlockRenderer", () => {
  it("renders a heading at the chosen level", () => {
    renderBlocks([{ type: "heading", text: "Eid Sale", level: "H3" }]);
    expect(screen.getByRole("heading", { level: 3, name: "Eid Sale" })).toBeInTheDocument();
  });

  it("renders markdown bold, links and bullets as elements, not raw text", () => {
    renderBlocks([{ type: "text", text: "A **bold** [link](/shop).\n\n- one\n- two" }]);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: "link" })).toHaveAttribute("href", "/shop");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText(/\*\*bold\*\*/)).not.toBeInTheDocument();
  });

  it("refuses to build a link from a javascript: href", () => {
    renderBlocks([{ type: "text", text: "[click](javascript:alert(1))" }]);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("click")).toBeInTheDocument();
  });

  it("renders an offer banner with its code", () => {
    renderBlocks([{ type: "offer", kicker: "Limited", title: "Save big", desc: "This week", code: "EID500", theme: "Ink" }]);
    expect(screen.getByText("Save big")).toBeInTheDocument();
    expect(screen.getByText("EID500")).toBeInTheDocument();
  });

  it("skips an empty heading and an image with no url rather than rendering blanks", () => {
    const { container } = renderBlocks([
      { type: "heading", text: "" },
      { type: "image", url: "", alt: "", caption: "" },
    ]);
    expect(container.querySelector("h2")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("skips an unknown block type instead of crashing the page around it", () => {
    renderBlocks([{ type: "video", url: "/a.mp4" }, { type: "heading", text: "Still here", level: "H2" }]);
    expect(screen.getByRole("heading", { name: "Still here" })).toBeInTheDocument();
  });

  it("pairs consecutive half-width blocks into one row", () => {
    const { container } = renderBlocks([
      { type: "heading", text: "A", level: "H2", width: "Half" },
      { type: "heading", text: "B", level: "H2", width: "Half" },
      { type: "heading", text: "C", level: "H2", width: "Full" },
    ]);
    expect(container.querySelectorAll(".md\\:grid-cols-2")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "C" })).toBeInTheDocument();
  });

  it("renders a button block as a router link", () => {
    renderBlocks([{ type: "button", text: "Shop now", link: "/shop", variant: "Lime pill" }]);
    expect(screen.getByRole("link", { name: "Shop now" })).toHaveAttribute("href", "/shop");
  });

  it("renders nothing at all for an empty block list", () => {
    const { container } = renderBlocks([]);
    expect(container).toBeEmptyDOMElement();
  });
});
