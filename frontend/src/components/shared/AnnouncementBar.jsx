import { useLocation } from "react-router";

import { useSettings } from "@/features/settings/api/useSettings";
import { ROUTES } from "@/constants/routes";

// Design's default announcement segments (desktop only). An admin can override
// with a single custom message via Settings → Announcement bar.
const DEFAULT_SEGMENTS = [
  "100% authentic — every piece hand-verified",
  "Collector-grade packaging",
  "COD · bKash · BanglaQR",
];

function Dot() {
  return <span className="size-1 rounded-full bg-brand" aria-hidden />;
}

export function AnnouncementBar() {
  const { data: settings } = useSettings();
  const { pathname } = useLocation();
  // Per the design, the announcement bar appears on the home page only — inner
  // pages (Shop/PDP/Cart/…) start directly with the header.
  if (pathname !== ROUTES.HOME) return null;

  const announcement = settings?.announcementBar;
  const hasCustom = announcement?.isActive && announcement?.text;

  return (
    <div className="hidden items-center justify-center gap-3.5 bg-ink px-5 py-[9px] text-center text-[12.5px] font-medium text-[#DDDFD2] md:flex">
      {hasCustom ? (
        <span>{announcement.text}</span>
      ) : (
        DEFAULT_SEGMENTS.map((seg, i) => (
          <span key={seg} className="flex items-center gap-3.5">
            {i > 0 && <Dot />}
            <span>{seg}</span>
          </span>
        ))
      )}
    </div>
  );
}
