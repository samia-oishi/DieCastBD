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

const num = (rect, attr) => Number(rect.getAttribute(attr));
// HEIGHT 260 − PAD_TOP 18 − PAD_BOTTOM 30 ⇒ the ৳0 line sits at y = 230.
const BASELINE = 230;

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

  it("rounds the axis so gridlines are evenly spaced round numbers", () => {
    // A ৳13,230 peak scaled raw gave ৳0·৳3k·৳7k·৳10k·৳13k — rounded labels on
    // unrounded lines, which reads as misaligned. It should step in 4s to 16k.
    const { container } = render(<RevenueChart data={[day("2026-09-17", 13230, 9636)]} />);
    for (const label of ["৳0", "৳4k", "৳8k", "৳12k", "৳16k"]) {
      expect(container.textContent).toContain(label);
    }
  });

  it("never prints the same axis label on two gridlines", () => {
    const { container } = render(<RevenueChart data={[day("2026-09-15", 3000, 1000)]} />);
    const labels = [...container.querySelectorAll("text")]
      .map((t) => t.textContent)
      .filter((t) => t.startsWith("৳"));
    expect(new Set(labels).size).toBe(labels.length);
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

  it("stacks bars from the ৳0 baseline, not hanging from their revenue value", () => {
    // The regression: cost and profit were both drawn at the bar's top, so a
    // bar reached down only as far as its cost and floated above the axis —
    // ৳13,230 revenue with ৳3,594 profit ended at ৳3.6k instead of ৳0.
    const { container } = render(<RevenueChart data={[day("2026-09-17", 13230, 9636)]} />);
    const bottom = Math.max(...barsIn(container).map((r) => num(r, "y") + num(r, "height")));
    expect(bottom).toBeCloseTo(BASELINE, 1);
  });

  it("makes the two segments add up to the whole bar", () => {
    const { container } = render(<RevenueChart data={[day("2026-09-17", 13230, 9636)]} />);
    const rects = barsIn(container);
    expect(rects).toHaveLength(2);
    const top = Math.min(...rects.map((r) => num(r, "y")));
    const summed = rects.reduce((n, r) => n + num(r, "height"), 0);
    // No overlap and no gap: the segments tile the bar exactly.
    expect(top + summed).toBeCloseTo(BASELINE, 1);
  });

  it("puts profit above cost, since profit is the top of the stack", () => {
    const { container } = render(<RevenueChart data={[day("2026-09-17", 10000, 6000)]} />);
    const rects = barsIn(container);
    const profit = rects.find((r) => r.getAttribute("fill") === "#A8CD2F");
    const cost = rects.find((r) => r.getAttribute("fill") === "#DEDFD6");
    expect(num(profit, "y")).toBeLessThan(num(cost, "y"));
  });

  it("renders a loss day without a negative-height bar", () => {
    // cogs above revenue: the bar must still draw, as a single solid block.
    const { container } = render(<RevenueChart data={[day("2026-09-15", 1000, 1600)]} />);
    for (const rect of barsIn(container)) {
      expect(Number(rect.getAttribute("height"))).toBeGreaterThanOrEqual(0);
    }
  });
});
