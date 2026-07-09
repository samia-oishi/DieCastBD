import { CarFront } from "lucide-react";
import { InstagramIcon } from "@/components/shared/SocialIcons";

export function InstagramPlaceholder({ instagramUrl }) {
  return (
    <section className="border-t border-border px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-center gap-2">
          <InstagramIcon className="size-5 text-muted-foreground" />
          <h2 className="font-heading text-2xl text-foreground sm:text-3xl">@diecastbd</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex aspect-square items-center justify-center rounded-lg bg-card">
              <CarFront className="size-6 text-muted-foreground/30" strokeWidth={1.25} />
            </div>
          ))}
        </div>
        {instagramUrl && (
          <div className="mt-6 text-center">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Follow us on Instagram
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
