import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/shared/Seo";
import { ROUTES } from "@/constants/routes";

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <Seo title="Unauthorized" noindex />
      <h1 className="font-heading text-3xl">Unauthorized</h1>
      <p className="text-muted-foreground">You don't have permission to view this page.</p>
      <Button asChild>
        <Link to={ROUTES.HOME}>Back to home</Link>
      </Button>
    </div>
  );
}
