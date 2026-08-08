"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function SubPageHeader({
  title,
  fallbackHref,
  right,
}: {
  title: string;
  fallbackHref?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-border bg-app/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-3">
        <button
          onClick={() => (fallbackHref ? router.push(fallbackHref) : router.back())}
          aria-label="Back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="flex-1 truncate text-lg font-semibold text-ink">{title}</h1>
        {right}
      </div>
    </header>
  );
}
