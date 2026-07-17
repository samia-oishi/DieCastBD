import { useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/api/useSettings";
import { ICON_MAP } from "@/components/shared/settingsIcons";
import { ROUTES } from "@/constants/routes";

// Fully data-driven announcement bar (Settings → Announcement bar). Desktop and
// mobile carry independent message lists + toggles; OFF genuinely hides the bar
// (there is no hardcoded fallback copy anymore — the shipped design lines live
// in the Settings document as real editable messages).

const SEPARATOR_GLYPHS = { pipe: "|", slash: "/", diamond: "◆", star: "✦" };

function Separator({ style: sepStyle, color }) {
  if (sepStyle === "none") return null; // messages separated by whitespace only
  if (sepStyle === "dot" || !SEPARATOR_GLYPHS[sepStyle]) {
    return <span className="size-1 shrink-0 rounded-full bg-brand" style={color ? { backgroundColor: color } : undefined} aria-hidden />;
  }
  return (
    <span className="shrink-0 text-[11px] leading-none text-brand" style={color ? { color } : undefined} aria-hidden>
      {SEPARATOR_GLYPHS[sepStyle]}
    </span>
  );
}

function Segments({ bar, messages }) {
  return messages.map((m, i) => {
    const Icon = m.icon ? ICON_MAP[m.icon] : null;
    return (
      <span key={i} className="flex shrink-0 items-center gap-3.5">
        {i > 0 && <Separator style={bar.separatorStyle} color={bar.separatorColor} />}
        <span className="flex shrink-0 items-center gap-1.5">
          {Icon && (
            <Icon size={13} strokeWidth={2} className="shrink-0 text-brand" style={bar.iconColor ? { color: bar.iconColor } : undefined} aria-hidden />
          )}
          <span className="whitespace-nowrap">{m.text}</span>
        </span>
      </span>
    );
  });
}

/** One rendered bar (desktop or mobile variant — `visibility` supplies the
 * breakpoint classes). Pauses on hover; disabled entirely for
 * prefers-reduced-motion (see index.css). */

/** Marquee variant. The loop is seamless only if the track is EXACTLY two
 * identical halves (translateX(-50%) must land on a pixel-identical frame), and
 * the bar only looks continuous if one half is at least as wide as the bar — so
 * the message run is tiled `copies` times per half, measured against the
 * container (and re-measured on resize / after fonts load). All spacing lives
 * INSIDE each copy (gap + trailing pr, no gaps between copies/halves): a gap on
 * the track would make -50% miss by half a gap and visibly jump every loop.
 * Duration scales with `copies` so the admin's scrollSpeed stays "seconds for
 * the message run to pass" — the same visual velocity on every screen width. */
function MarqueeBar({ bar, messages, visibility, style }) {
  const containerRef = useRef(null);
  const runRef = useRef(null);
  const [copies, setCopies] = useState(1);

  useLayoutEffect(() => {
    const measure = () => {
      const containerW = containerRef.current?.offsetWidth ?? 0;
      const runW = runRef.current?.offsetWidth ?? 0;
      if (containerW && runW) setCopies(Math.max(1, Math.ceil(containerW / runW)));
    };
    measure();
    // Fonts load after first paint and change the run width.
    document.fonts?.ready?.then(measure).catch(() => {});
    if (typeof ResizeObserver === "undefined" || !containerRef.current) return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [messages]);

  return (
    <div ref={containerRef} className={cn("overflow-hidden bg-ink py-[9px] text-[12.5px] font-medium text-[#DDDFD2]", visibility)} style={style}>
      <div
        className="announce-marquee flex w-max items-center"
        style={{ "--marquee-duration": `${(bar.scrollSpeed || 20) * copies}s` }}
      >
        {[0, 1].map((half) => (
          <span key={half} className="flex items-center">
            {Array.from({ length: copies }, (_, i) => (
              <span
                key={i}
                ref={half === 0 && i === 0 ? runRef : undefined}
                // With no separator the gap IS the separation — widen it so
                // messages don't read as one run-on line.
                className={cn("flex items-center", bar.separatorStyle === "none" ? "gap-7 pr-7" : "gap-3.5 pr-3.5")}
                aria-hidden={(half > 0 || i > 0) || undefined}
              >
                <Segments bar={bar} messages={messages} />
                <Separator style={bar.separatorStyle} color={bar.separatorColor} />
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

function Bar({ bar, device, visibility }) {
  const messages = (device?.messages ?? []).filter((m) => m.text?.trim());
  if (!device?.isActive || messages.length === 0) return null;

  const style = {
    ...(bar.bgColor ? { backgroundColor: bar.bgColor } : {}),
    ...(bar.textColor ? { color: bar.textColor } : {}),
  };

  if (device.autoScroll) {
    return <MarqueeBar bar={bar} messages={messages} visibility={visibility} style={style} />;
  }

  return (
    <div
      className={cn(
        "items-center justify-center overflow-hidden bg-ink px-5 py-[9px] text-center text-[12.5px] font-medium text-[#DDDFD2]",
        bar.separatorStyle === "none" ? "gap-7" : "gap-3.5",
        visibility
      )}
      style={style}
    >
      <Segments bar={bar} messages={messages} />
    </div>
  );
}

export function AnnouncementBar() {
  const { data: settings } = useSettings();
  const { pathname } = useLocation();

  const bar = settings?.announcementBar;
  if (!bar) return null;

  // Home-only unless the admin flips "Show on all pages".
  if (!bar.showOnAllPages && pathname !== ROUTES.HOME) return null;

  // Deploy safety: a Settings document still carrying the OLD `{ text, isActive }`
  // shape (frontend deployed before the DB was migrated) renders the legacy
  // single-text desktop bar rather than nothing.
  if (!bar.desktop && !bar.mobile) {
    if (!bar.isActive || !bar.text) return null;
    return (
      <div className="hidden items-center justify-center bg-ink px-5 py-[9px] text-center text-[12.5px] font-medium text-[#DDDFD2] md:flex">
        <span>{bar.text}</span>
      </div>
    );
  }

  return (
    <>
      <Bar bar={bar} device={bar.desktop} visibility={bar.desktop?.autoScroll ? "hidden md:block" : "hidden md:flex"} />
      <Bar bar={bar} device={bar.mobile} visibility={bar.mobile?.autoScroll ? "md:hidden" : "flex md:hidden"} />
    </>
  );
}
