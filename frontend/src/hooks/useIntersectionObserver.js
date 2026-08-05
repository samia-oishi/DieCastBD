import { useCallback, useEffect, useRef, useState } from "react";

/** Calls `onIntersect` when the returned ref's element scrolls into view.
 *
 * Returns a CALLBACK ref — attach it with `<div ref={sentinelRef} />`. It has
 * to be a callback ref rather than a `useRef` object: callers typically render
 * the sentinel conditionally (only while there's a next page to load), so an
 * object ref can still be null when the effect runs, and the effect has no way
 * to know when it stops being null.
 *
 * @param onIntersect fires once per entry into view (never on exit)
 * @param enabled     false disconnects the observer entirely — use it to gate
 *                    on "a fetch is already in flight" so a fast scroll can't
 *                    queue duplicate loads
 * @param once        disconnect after the first intersection
 */
export function useIntersectionObserver({
  onIntersect,
  enabled = true,
  rootMargin = "0px",
  threshold = 0,
  root = null,
  once = false,
} = {}) {
  const [node, setNode] = useState(null);

  // The callback lives in a ref and is deliberately NOT an effect dependency.
  // Callers pass an inline arrow, which is a new function every render — as a
  // dependency it would tear down and rebuild the observer on each render, and
  // an observer created mid-scroll silently misses the intersection that is
  // already in progress.
  const callbackRef = useRef(onIntersect);
  useEffect(() => {
    callbackRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    // jsdom (and any SSR pass) has no IntersectionObserver — mirrors the
    // ResizeObserver guard in AnnouncementBar. Being inert rather than throwing
    // means unit tests exercise the manual "Load more" path without a stub.
    if (typeof IntersectionObserver === "undefined") return undefined;
    if (!node || !enabled) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Only entering the viewport counts. This is also what keeps a
          // sentinel inside a `display:none` subtree harmless: observe()
          // always queues an initial callback, but a element with no layout
          // box reports isIntersecting: false.
          if (!entry.isIntersecting) continue;
          callbackRef.current?.(entry);
          if (once) observer.disconnect();
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, enabled, root, rootMargin, threshold, once]);

  return useCallback((el) => setNode(el), []);
}
