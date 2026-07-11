import { useSettings } from "@/features/settings/api/useSettings";

export function AnnouncementBar() {
  const { data: settings } = useSettings();
  const announcement = settings?.announcementBar;

  if (!announcement?.isActive || !announcement?.text) return null;

  return (
    <div className="flex items-center justify-center gap-3.5 bg-ink px-5 py-2.5 text-center text-xs font-medium text-[#DDDFD2] sm:text-[12.5px]">
      {announcement.text}
    </div>
  );
}
