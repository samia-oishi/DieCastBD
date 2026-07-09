import { useSettings } from "@/features/settings/api/useSettings";

export function AnnouncementBar() {
  const { data: settings } = useSettings();
  const announcement = settings?.announcementBar;

  if (!announcement?.isActive || !announcement?.text) return null;

  return (
    <div className="bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground sm:text-sm">
      {announcement.text}
    </div>
  );
}
