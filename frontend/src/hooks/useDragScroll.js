import { useEffect, useRef } from "react";

// Every *.dc.html reference implements a global pointerdown/pointermove
// handler so its horizontal-scroll rows (chip toolbars, shelf tiles,
// carousels) can be dragged with a mouse, not just swiped with touch —
// browsers only give native drag-to-scroll for touch/trackpad, not a mouse
// pointer. That handler is viewer-runtime-only and was never ported, so any
// row built with a bare `overflow-x-auto` div only scrolls via touch or a
// horizontal wheel gesture — dragging with a mouse (the default in most
// desktop QA) visibly does nothing. This hook adds that behavior back,
// scoped to one ref instead of the reference's global "find the nearest
// scrollable ancestor under the cursor" listener.
export function useDragScroll() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onPointerDown = (e) => {
      if (e.pointerType !== "mouse") return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
    };

    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) {
        moved = true;
        document.body.style.userSelect = "none";
      }
      if (moved) {
        el.scrollLeft = startScrollLeft - dx;
        e.preventDefault();
      }
    };

    const endDrag = () => {
      if (moved) document.body.style.userSelect = "";
      dragging = false;
    };

    // A drag that moved the row shouldn't also fire the card/tile's own
    // click-to-navigate — same "suppress the click after a real drag"
    // behavior the reference itself implements.
    const onClickCapture = (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return ref;
}
