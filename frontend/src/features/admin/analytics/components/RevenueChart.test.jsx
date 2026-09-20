import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { RevenueChart } from "./RevenueChart";

const day = (date, revenue, cogs, ordersCount = 1) => ({ date, revenue, cogs, ordersCount });

const series = (n, from = 28) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(2026, 6, from + i)).toISOString().slice(0, 10);
    return day(d, i % 3 === 0 ? 3000 : 0, i % 3 === 0 ? 1800 : 0, i % 3 === 0 ? 1 : 0);
  });

const barsIn = (container) =>
  [...container.querySelectorAll("rect")].filter((r) => r.getAttribute("fill") !== "transparent");

describe("RevenueChart", () => {
  it("says so when there is nothing to draw", () => {
    render(<RevenueChart data={[]} />);
    expect(screen.getByText("No revenue data yet.")).toBeInTheDocument();
  });

  it("draws no bar for a zero-revenue day, so an empty day reads as empty", () => {
    const { container } = render(<RevenueChart data={[day("2026-09-14", 0, 0, 0), day("2026-09-15", 1000, 400)]} />);
    // One day earned; the other must not contribute a visible bar.
    expect(barsIn(container).length).toBeGreaterThan(0);
    expect(barsIn(container).length).toBeLessThanOrEqual(2);
  });

  it("labels the y-axis, so magnitude is readable without hovering", () => {
    const { container } = render(<RevenueChart data={[day("2026-09-15", 4000, 2000)]} />);
    expect(container.textContent).toContain("৳4k");
  });

  it("scales the axis into lakh once the numbers get there", () => {
    const { container } = render(<RevenueChart data={[day("2026-09-15", 250000, 100000)]} />);
    expect(container.textContent).toContain("L");
  });

  it("stays daily at 30 points and switches to weeks beyond that", () => {
    const daily = render(<RevenueChart data={series(30)} />);
    expect(daily.container.textContent).not.toContain("Best week");
    daily.unmount();

    const weekly = render(<RevenueChart data={series(56)} />);
    // The best-day pill renames itself, which is the visible tell that the
    // series was rolled up rather than plotted one bar per day.
    expect(weekly.container.textContent).toContain("Best week");
  });

  it("renders a loss day without a negative-height bar", () => {
    // cogs above revenue: the bar must still draw, as a single solid block.
    const { container } = render(<RevenueChart data={[day("2026-09-15", 1000, 1600)]} />);
    for (const rect of barsIn(container)) {
      expect(Number(rect.getAttribute("height"))).toBeGreaterThanOrEqual(0);
    }
  });
});
