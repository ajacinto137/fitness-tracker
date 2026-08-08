import Link from "next/link";
import { Settings } from "lucide-react";

export function TopBar({ title }: { title: string }) {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-border bg-app/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink-secondary hover:bg-surface-hover"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
