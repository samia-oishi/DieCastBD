import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { AnnouncementBar } from "./AnnouncementBar";

let mockSettings = null;
vi.mock("@/features/settings/api/useSettings", () => ({
  useSettings: () => ({ data: mockSettings }),
}));

const NEW_BAR = (overrides = {}) => ({
  bgColor: "",
  textColor: "",
  iconColor: "",
  separatorColor: "",
  separatorStyle: "dot",
  showOnAllPages: false,
  scrollSpeed: 20,
  desktop: { isActive: false, autoScroll: false, messages: [] },
  mobile: { isActive: false, autoScroll: false, messages: [] },
  ...overrides,
});

function renderAt(path, announcementBar) {
  mockSettings = announcementBar === undefined ? null : { announcementBar };
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AnnouncementBar />
    </MemoryRouter>
  );
}

describe("AnnouncementBar", () => {
  it("renders nothing without settings, and nothing when both devices are off", () => {
    const a = renderAt("/", undefined);
    expect(a.container).toBeEmptyDOMElement();
    a.unmount();

    // OFF genuinely hides the bar — there is no hardcoded fallback anymore.
    const b = renderAt("/", NEW_BAR());
    expect(b.container).toBeEmptyDOMElement();
  });

  it("legacy shape (pre-migration DB): active text renders, inactive renders nothing", () => {
    const a = renderAt("/", { text: "Old style message", isActive: true });
    expect(screen.getByText("Old style message")).toBeInTheDocument();
    a.unmount();

    const b = renderAt("/", { text: "Old style message", isActive: false });
    expect(b.container).toBeEmptyDOMElement();
  });

  it("desktop and mobile render their own messages with the right breakpoint classes", () => {
    renderAt(
      "/",
      NEW_BAR({
        desktop: { isActive: true, autoScroll: false, messages: [{ icon: "", text: "Desktop line" }] },
        mobile: { isActive: true, autoScroll: false, messages: [{ icon: "", text: "Mobile line" }] },
      })
    );
    const desktop = screen.getByText("Desktop line").closest("div[class]");
    const mobile = screen.getByText("Mobile line").closest("div[class]");
    expect(desktop.className).toContain("md:flex");
    expect(desktop.className).toContain("hidden");
    expect(mobile.className).toContain("md:hidden");
  });

  it("a device with only blank messages hides, even when active", () => {
    const r = renderAt(
      "/",
      NEW_BAR({ desktop: { isActive: true, autoScroll: false, messages: [{ icon: "", text: "  " }] } })
    );
    expect(r.container).toBeEmptyDOMElement();
  });

  it("applies custom colors inline and renders the chosen separator glyph", () => {
    renderAt(
      "/",
      NEW_BAR({
        bgColor: "#112233",
        textColor: "#FFEEDD",
        separatorStyle: "diamond",
        separatorColor: "#FF0000",
        desktop: {
          isActive: true,
          autoScroll: false,
          messages: [
            { icon: "", text: "One" },
            { icon: "", text: "Two" },
          ],
        },
      })
    );
    const bar = screen.getByText("One").closest("div[class]");
    expect(bar).toHaveStyle({ backgroundColor: "#112233", color: "#FFEEDD" });
    const sep = screen.getByText("◆");
    expect(sep).toHaveStyle({ color: "#FF0000" });
  });

  it("autoScroll renders the marquee track with the admin's duration and a duplicated run", () => {
    renderAt(
      "/",
      NEW_BAR({
        scrollSpeed: 42,
        desktop: { isActive: true, autoScroll: true, messages: [{ icon: "", text: "Scrolls" }] },
      })
    );
    const track = document.querySelector(".announce-marquee");
    expect(track).not.toBeNull();
    expect(track.style.getPropertyValue("--marquee-duration")).toBe("42s");
    // two copies of the run → a seamless -50% loop
    expect(screen.getAllByText("Scrolls")).toHaveLength(2);
  });

  it("home-only by default; showOnAllPages lifts the gate", () => {
    const active = { isActive: true, autoScroll: false, messages: [{ icon: "", text: "Anywhere" }] };

    const a = renderAt("/shop", NEW_BAR({ desktop: active }));
    expect(a.container).toBeEmptyDOMElement();
    a.unmount();

    renderAt("/shop", NEW_BAR({ desktop: active, showOnAllPages: true }));
    expect(screen.getByText("Anywhere")).toBeInTheDocument();
  });
});
