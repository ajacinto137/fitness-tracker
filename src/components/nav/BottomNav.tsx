"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Dumbbell } from "lucide-react";
import { clsx } from "clsx";

const tabs = [
  { href: "/weight", label: "Weight", icon: Scale, iconClass: "text-weight", washClass: "bg-weight-wash", glowClass: "glow-weight" },
  { href: "/lifting", label: "Lifting", icon: Dumbbell, iconClass: "text-strength", washClass: "bg-strength-wash", glowClass: "glow-strength" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-stretch">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <span
                className={clsx(
                  "flex h-7 w-10 items-center justify-center rounded-full transition-all duration-200",
                  active && [tab.washClass, tab.glowClass]
                )}
              >
                <Icon
                  className={clsx("h-5 w-5 transition-colors duration-200", active ? tab.iconClass : "text-ink-muted")}
                  strokeWidth={active ? 2.4 : 2}
                />
              </span>
              <span
                className={clsx(
                  "text-xs font-medium transition-colors duration-200",
                  active ? tab.iconClass : "text-ink-muted"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
