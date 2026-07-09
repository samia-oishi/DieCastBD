import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <h1 className="font-heading text-3xl">Page not found</h1>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Button asChild>
        <Link to={ROUTES.HOME}>Back to home</Link>
      </Button>
    </div>
  );
}
