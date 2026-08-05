import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { useState } from "react";

import { useIntersectionObserver } from "./useIntersectionObserver";

/** Minimal IntersectionObserver stub that lets a test drive intersections.
 * Stubbed per-file (never in src/test/setup.js) so no other suite's
 * environment silently changes. */
function installStub() {
  const instances = [];
  class MockIO {
    constructor(cb, options) {
      this.cb = cb;
      this.options = options;
      this.observed = [];
      this.disconnected = false;
      instances.push(this);
    }
    observe(el) { this.observed.push(el); }
    disconnect() { this.disconnected = true; }
    unobserve() {}
    trigger(isIntersecting = true) { this.cb([{ isIntersecting, target: this.observed[0] }], this); }
  }
  vi.stubGlobal("IntersectionObserver", MockIO);
  return instances;
}

function Host({ onIntersect, enabled = true, once = false, extra }) {
  const ref = useIntersectionObserver({ onIntersect, enabled, once });
  return (
    <div>
      <span>{extra}</span>
      <div data-testid="sentinel" ref={ref} />
    </div>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("useIntersectionObserver", () => {
  it("is inert when IntersectionObserver is unavailable (jsdom/SSR)", () => {
    const onIntersect = vi.fn();
    // No stub installed — this must not throw, so the manual fallback path
    // stays testable without ceremony.
    expect(() => render(<Host onIntersect={onIntersect} />)).not.toThrow();
    expect(onIntersect).not.toHaveBeenCalled();
  });

  it("observes the element and fires on entry", () => {
    const instances = installStub();
    const onIntersect = vi.fn();
    render(<Host onIntersect={onIntersect} />);
    expect(instances).toHaveLength(1);
    instances[0].trigger(true);
    expect(onIntersect).toHaveBeenCalledTimes(1);
  });

  it("ignores exits — only entering the viewport counts", () => {
    const instances = installStub();
    const onIntersect = vi.fn();
    render(<Host onIntersect={onIntersect} />);
    instances[0].trigger(false);
    expect(onIntersect).not.toHaveBeenCalled();
  });

  // The regression guard: an inline arrow at the call site is a new function
  // every render. If it were an effect dependency the observer would be torn
  // down and rebuilt constantly, dropping intersections mid-scroll.
  it("does not rebuild the observer when the callback identity changes", () => {
    const instances = installStub();
    const { rerender } = render(<Host onIntersect={() => {}} extra="a" />);
    rerender(<Host onIntersect={() => {}} extra="b" />);
    rerender(<Host onIntersect={() => {}} extra="c" />);
    expect(instances).toHaveLength(1);
    expect(instances[0].disconnected).toBe(false);
  });

  it("calls the LATEST callback, not a stale closure", () => {
    const instances = installStub();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Host onIntersect={first} />);
    rerender(<Host onIntersect={second} />);
    instances[0].trigger(true);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("disconnects while disabled and reconnects when re-enabled", () => {
    const instances = installStub();
    const onIntersect = vi.fn();
    const { rerender } = render(<Host onIntersect={onIntersect} enabled={true} />);
    rerender(<Host onIntersect={onIntersect} enabled={false} />);
    expect(instances[0].disconnected).toBe(true);
    rerender(<Host onIntersect={onIntersect} enabled={true} />);
    expect(instances).toHaveLength(2);
    instances[1].trigger(true);
    expect(onIntersect).toHaveBeenCalledTimes(1);
  });

  it("disconnects on unmount", () => {
    const instances = installStub();
    const { unmount } = render(<Host onIntersect={vi.fn()} />);
    unmount();
    expect(instances[0].disconnected).toBe(true);
  });

  it("stops after the first hit when once is set", () => {
    const instances = installStub();
    const onIntersect = vi.fn();
    render(<Host onIntersect={onIntersect} once />);
    instances[0].trigger(true);
    expect(instances[0].disconnected).toBe(true);
  });

  it("attaches to an element that only appears on a later render", () => {
    const instances = installStub();
    function Conditional() {
      const [show, setShow] = useState(false);
      const ref = useIntersectionObserver({ onIntersect: vi.fn() });
      return (
        <>
          <button onClick={() => setShow(true)}>show</button>
          {show && <div ref={ref} />}
        </>
      );
    }
    const { getByText } = render(<Conditional />);
    expect(instances).toHaveLength(0); // nothing to observe yet
    fireEvent.click(getByText("show"));
    expect(instances).toHaveLength(1); // callback ref caught the late mount
  });
});
