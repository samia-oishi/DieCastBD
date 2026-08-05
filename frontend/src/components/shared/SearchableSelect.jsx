import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";

/** Single-select dropdown with a type-to-filter box, for lists too long to scan
 * (the 64 districts of Bangladesh, or the 55 thanas of Dhaka).
 *
 * The panel opens **in the document flow** rather than as a floating popover,
 * which is the whole reason this exists instead of a Radix popover or cmdk:
 *
 *  · The address form renders inside ResponsiveModal, whose mobile SheetContent
 *    is `overflow-y-auto` — an absolutely-positioned panel is clipped there.
 *  · Portalling out of that would escape the Sheet/Dialog focus trap, which
 *    then refuses to hand focus to the search box.
 *  · On a phone the virtual keyboard eats the bottom half of the screen, so an
 *    anchored panel routinely has room for two options.
 *
 * In flow, the surrounding scroll container just scrolls to reveal it, and the
 * browser's own "scroll the focused field into view" handles the keyboard. The
 * cost is that opening pushes later fields down; the panel is height-capped to
 * keep that small.
 *
 * @param options  [{ value, label?, keywords? }] — `keywords` also match while
 *                 filtering but are never displayed (old district spellings).
 * @param value    currently selected `value`, or "" for none
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Type to search…",
  emptyMessage = "No matches",
  disabled = false,
  disabledHint,
  id,
  invalid = false,
  name,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const reactId = useId();
  const listId = `${id ?? reactId}-listbox`;
  const optionId = (i) => `${id ?? reactId}-opt-${i}`;

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // Prefix matches first: typing "dha" should surface Dhaka above Chapainawabganj.
    const scored = [];
    for (const o of options) {
      const haystacks = [o.label ?? o.value, ...(o.keywords ?? [])].map((s) => s.toLowerCase());
      let best = -1;
      for (const h of haystacks) {
        const at = h.indexOf(q);
        if (at === -1) continue;
        if (best === -1 || at < best) best = at;
      }
      if (best !== -1) scored.push({ o, best });
    }
    return scored.sort((a, b) => a.best - b.best).map((s) => s.o);
  }, [options, query]);

  // Reopening should start from the current selection, not the top of the list.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    const at = options.findIndex((o) => o.value === value);
    setActiveIndex(at === -1 ? 0 : at);
    inputRef.current?.focus();
  }, [open, options, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keep the active option visible while arrowing through a long list. The
  // optional call matches the matchMedia/IntersectionObserver guards elsewhere:
  // jsdom implements no layout, so scrollIntoView is simply absent there.
  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelector('[data-active="true"]');
    active?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeIndex, filtered]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const commit = (option) => {
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onSearchKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!filtered.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => (i + step + filtered.length) % filtered.length);
      return;
    }
    if (e.key === "Enter") {
      // Both guards matter. preventDefault stops an implicit form submit;
      // stopPropagation stops AddressForm's "Enter on an INPUT saves the
      // address" handler, which would otherwise submit a half-filled form the
      // moment someone pressed Enter to pick their district.
      e.preventDefault();
      e.stopPropagation();
      commit(filtered[activeIndex]);
      return;
    }
    if (e.key === "Escape") {
      // Contained here so Escape closes this list rather than the whole
      // address modal it may be sitting inside.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "Tab") setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Mirrors the selection for uncontrolled consumers and autofill. */}
      {name && <input type="hidden" name={name} value={value ?? ""} />}

      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[12px] border bg-white px-[14px] py-3 text-left text-base leading-[1.35] text-ink focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-brand md:text-sm",
          invalid ? "border-danger" : "border-line",
          disabled && "cursor-not-allowed bg-[#F6F7F2] text-faint"
        )}
      >
        <span className={cn("truncate", !selected && "text-[#A2A499]")}>
          {selected ? (selected.label ?? selected.value) : disabled && disabledHint ? disabledHint : placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          aria-hidden
          className={cn("shrink-0 text-faint transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="mt-1.5 overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_12px_32px_rgba(16,18,8,0.10)]">
          <div className="relative border-b border-line-soft">
            <Search size={15} strokeWidth={2} aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={filtered.length ? optionId(activeIndex) : undefined}
              aria-label={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={searchPlaceholder}
              autoComplete="off"
              className="w-full bg-transparent py-3 pl-10 pr-3 text-base leading-[1.35] text-ink placeholder:text-[#A2A499] focus:outline-none md:text-sm"
            />
          </div>

          <ul ref={listRef} id={listId} role="listbox" className="max-h-[228px] overflow-y-auto overscroll-contain py-1">
            {filtered.map((o, i) => {
              const isSelected = o.value === value;
              return (
                // The option itself is the click target — an interactive
                // element nested inside role="option" is invalid ARIA, and
                // keyboard users drive this through aria-activedescendant
                // rather than by focusing rows.
                //
                // onMouseDown, not onClick: the outside-pointerdown listener
                // would otherwise close the panel before click fires.
                <li
                  key={o.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  data-active={i === activeIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(o);
                  }}
                  onMouseMove={() => setActiveIndex(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-[14px] leading-[1.35] text-ink md:text-[13.5px]",
                    i === activeIndex && "bg-[#F3F7E6]",
                    isSelected && "font-semibold"
                  )}
                >
                  <span className="truncate">{o.label ?? o.value}</span>
                  {isSelected && <Check size={14} strokeWidth={2.4} aria-hidden className="shrink-0 text-brand-deep" />}
                </li>
              );
            })}

            {!filtered.length && <li className="px-3.5 py-3 text-[13.5px] text-faint">{emptyMessage}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
