import { useRef, useCallback } from "react";

/** Pointer-drag horizontal scrolling for carousels (matches the design's
 * click-and-drag behavior). Returns a ref to attach to the scroll container and
 * handlers. Native touch scrolling is untouched; this adds mouse drag and
 * suppresses the click that would otherwise fire after a drag. */
export function useDragScroll() {
  const ref = useRef(null);
  const state = useRef({ down: false, moved: false, startX: 0, startLeft: 0 });

  const onPointerDown = useCallback((e) => {
    if (e.pointerType && e.pointerType !== "mouse") return; // let touch scroll natively
    const el = ref.current;
    if (!el) return;
    state.current = { down: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft };
  }, []);

  const onPointerMove = useCallback((e) => {
    const s = state.current;
    const el = ref.current;
    if (!s.down || !el) return;
    const dx = e.clientX - s.startX;
    if (!s.moved && Math.abs(dx) > 6) {
      s.moved = true;
      el.style.scrollSnapType = "none";
      document.body.style.userSelect = "none";
    }
    if (s.moved) {
      el.scrollLeft = s.startLeft - dx;
      e.preventDefault();
    }
  }, []);

  const endDrag = useCallback(() => {
    const s = state.current;
    const el = ref.current;
    if (s.moved && el) {
      document.body.style.userSelect = "";
      el.style.scrollSnapType = "";
    }
    state.current.down = false;
  }, []);

  // Swallow the click that follows a drag so cards don't navigate on drag-release.
  const onClickCapture = useCallback((e) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      state.current.moved = false;
    }
  }, []);

  return {
    ref,
    dragProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
      onClickCapture,
      style: { cursor: "grab" },
    },
  };
}
