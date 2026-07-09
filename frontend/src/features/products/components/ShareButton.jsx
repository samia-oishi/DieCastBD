import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

export function ShareButton({ title }) {
  const onShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the native share sheet — not an error
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  return (
    <Button variant="outline" size="sm" onClick={onShare}>
      <Share2 /> Share
    </Button>
  );
}
