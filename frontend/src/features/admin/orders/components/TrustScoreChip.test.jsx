import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrustScoreChip } from "./TrustScoreChip";

const chip = () => screen.getByTitle(/Steadfast trust score/);

describe("TrustScoreChip", () => {
  it("shows nothing until a score has actually been fetched", () => {
    const { container } = render(<TrustScoreChip fraudCheck={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing when the courier answered without a number", () => {
    const { container } = render(<TrustScoreChip fraudCheck={{ level: "good", score: null }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the score and the courier's own level wording", () => {
    render(<TrustScoreChip fraudCheck={{ score: 60, level: "good", reasons: [] }} />);
    expect(chip()).toHaveTextContent("60");
    expect(chip()).toHaveTextContent("good");
  });

  // Their level vocabulary is undocumented and can grow. An unknown one must
  // still render — a blank cell would read as "not checked", the opposite of
  // the truth, in front of a decision about shipping goods on credit.
  it("renders a level it has never seen rather than hiding it", () => {
    render(<TrustScoreChip fraudCheck={{ score: 12, level: "some_new_level" }} />);
    expect(chip()).toHaveTextContent("some new level");
  });

  it("colours by the number, which is the one unambiguous field", () => {
    const bg = (score) => {
      const { unmount } = render(<TrustScoreChip fraudCheck={{ score }} />);
      const style = chip().getAttribute("style");
      unmount();
      return style;
    };
    expect(bg(85)).not.toBe(bg(50));
    expect(bg(50)).not.toBe(bg(10));
  });

  it("says plainly when there are no fraud reports", () => {
    render(<TrustScoreChip fraudCheck={{ score: 60, totalReports: 0 }} />);
    expect(chip().getAttribute("title")).toContain("No fraud reports");
  });
});
