import { Outlet } from "react-router";

export function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <span className="font-heading text-lg tracking-wide">DiecastBD</span>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border px-6 py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} DiecastBD
      </footer>
    </div>
  );
}
