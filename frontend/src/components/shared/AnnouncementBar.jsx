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
 * breakpoint classes). Marquee mode renders the segment run twice and slides it
 * by -50%, so the loop is seamless; the trailing separator between the two
 * copies keeps the rhythm. Pauses on hover; disabled entirely for
 * prefers-reduced-motion (see index.css). */
function Bar({ bar, device, visibility }) {
  const messages = (device?.messages ?? []).filter((m) => m.text?.trim());
  if (!device?.isActive || messages.length === 0) return null;

  const style = {
    ...(bar.bgColor ? { backgroundColor: bar.bgColor } : {}),
    ...(bar.textColor ? { color: bar.textColor } : {}),
  };

  if (device.autoScroll) {
    return (
      <div className={cn("overflow-hidden bg-ink py-[9px] text-[12.5px] font-medium text-[#DDDFD2]", visibility)} style={style}>
        <div
          className="announce-marquee flex w-max items-center gap-3.5"
          style={{ "--marquee-duration": `${bar.scrollSpeed || 20}s` }}
        >
          {[0, 1].map((copy) => (
            <span key={copy} className="flex items-center gap-3.5 pr-3.5" aria-hidden={copy === 1 || undefined}>
              <Segments bar={bar} messages={messages} />
              <Separator style={bar.separatorStyle} color={bar.separatorColor} />
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("items-center justify-center gap-3.5 overflow-hidden bg-ink px-5 py-[9px] text-center text-[12.5px] font-medium text-[#DDDFD2]", visibility)}
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
