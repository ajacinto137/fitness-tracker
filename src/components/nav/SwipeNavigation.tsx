"use client";

import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const TAB_ORDER = ["/weight", "/lifting"];
const SWIPE_THRESHOLD_PX = 60;
const HORIZONTAL_DOMINANCE_RATIO = 1.5;

/**
 * Lets users swipe left/right between the two bottom-nav tabs. Only active
 * on the tab root screens (not nested routes like /lifting/history), so it
 * doesn't fight with horizontal scrollers or back-navigation elsewhere.
 */
export function SwipeNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const tabIndex = TAB_ORDER.indexOf(pathname);

  function handleTouchStart(e: React.TouchEvent) {
    if (tabIndex === -1) return;
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || tabIndex === -1) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_DOMINANCE_RATIO) return;

    const nextIndex = tabIndex + (dx < 0 ? 1 : -1);
    if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) return;
    router.push(TAB_ORDER[nextIndex]);
  }

  return (
    <main
      className="mx-auto min-h-full w-full max-w-lg pb-28"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </main>
  );
}
