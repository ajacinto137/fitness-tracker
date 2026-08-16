"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Scale, Dumbbell, type LucideIcon } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const TAB_ORDER = ["/weight", "/lifting"];

const TAB_META: Record<string, { label: string; icon: LucideIcon; gradientClass: string }> = {
  "/weight": { label: "Weight", icon: Scale, gradientClass: "bg-gradient-weight" },
  "/lifting": { label: "Lifting", icon: Dumbbell, gradientClass: "bg-gradient-strength" },
};

// Physical-feel constants, tuned to iOS paging behavior.
const AXIS_LOCK_DEADZONE_PX = 10;
const AXIS_LOCK_RATIO = 1.15;
/** Apple's UIScrollView rubber-band formula: near-linear for small x, asymptotic beyond. */
const VALID_DIRECTION_COEFFICIENT = 0.82;
const INVALID_DIRECTION_COEFFICIENT = 0.22;
const INVALID_DIRECTION_MAX_PX = 56;
const COMMIT_DISTANCE_FRACTION = 0.33;
const COMMIT_VELOCITY_PX_MS = 0.45;
const MIN_FLICK_DISTANCE_PX = 24;
const SNAP_MIN_MS = 220;
const SNAP_MAX_MS = 420;
const SNAP_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

function rubberband(delta: number, dimension: number, coefficient: number) {
  const sign = delta < 0 ? -1 : 1;
  const abs = Math.abs(delta);
  return sign * ((abs * dimension * coefficient) / (dimension + coefficient * abs));
}

function readTranslateX(el: HTMLElement): number {
  const transform = getComputedStyle(el).transform;
  if (!transform || transform === "none") return 0;
  const matrix = transform.match(/^matrix\(([^)]+)\)$/) ?? transform.match(/^matrix3d\(([^)]+)\)$/);
  if (!matrix) return 0;
  const parts = matrix[1].split(",").map(Number);
  return parts.length === 16 ? parts[12] : (parts[4] ?? 0);
}

type Direction = "next" | "prev" | null;
type Phase = "idle" | "pending" | "horizontal" | "vertical";

/**
 * Drives an iOS-style interactive swipe between the two bottom-nav tabs.
 * Only active on the tab root screens (not nested routes like
 * /lifting/history), so it doesn't fight horizontal scrollers or
 * back-navigation elsewhere. The current page's real DOM is dragged 1:1
 * (rubber-banded) with the finger; the neighbor tab is revealed using the
 * last real render we saw for that route (cheap — no re-fetch, no extra
 * mount cost outside an active gesture) so users see genuine content, not a
 * placeholder, while dragging.
 */
export function SwipeNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);

  const tabIndex = TAB_ORDER.indexOf(pathname);
  const tabIndexRef = useRef(tabIndex);

  const [dragging, setDragging] = useState(false);
  const [peekDirection, setPeekDirection] = useState<Direction>(null);
  const [snapshotCache, setSnapshotCache] = useState<Record<string, React.ReactNode>>({});
  const draggingRef = useRef(false);
  const peekDirectionRef = useRef<Direction>(null);

  useEffect(() => {
    tabIndexRef.current = tabIndex;
  }, [tabIndex]);

  const gesture = useRef({
    phase: "idle" as Phase,
    startX: 0,
    startY: 0,
    startTime: 0,
    lastDx: 0,
    frameRequested: false,
    animating: false,
    generation: 0,
  });

  // Cache the last real render for each tab so a swipe can reveal genuine
  // content immediately, without re-fetching or keeping both routes mounted.
  // Adjusted during render (React's documented pattern for deriving state
  // from a prop change) rather than in an effect, since this is caching
  // React's own children, not syncing to an external system.
  const [cachedFor, setCachedFor] = useState<{ pathname: string; children: React.ReactNode } | null>(null);
  if (tabIndex !== -1 && (cachedFor === null || cachedFor.pathname !== pathname || cachedFor.children !== children)) {
    setCachedFor({ pathname, children });
    setSnapshotCache((prev) => ({ ...prev, [pathname]: children }));
  }

  // Once Next.js actually completes a navigation (ours or a bottom-nav tap),
  // the new page is now `children` — drop any leftover drag visuals. Guarded
  // so a plain (non-swipe) navigation, the common case, triggers no re-render.
  useEffect(() => {
    gesture.current.phase = "idle";
    gesture.current.animating = false;
    if (!draggingRef.current) return;
    const pane = paneRef.current;
    if (pane) {
      pane.style.transition = "";
      pane.style.transform = "";
    }
    draggingRef.current = false;
    peekDirectionRef.current = null;
    setDragging(false);
    setPeekDirection(null);
  }, [pathname]);

  const peekContent = peekDirection
    ? snapshotCache[TAB_ORDER[tabIndex + (peekDirection === "next" ? 1 : -1)]]
    : null;
  const peekPath = peekDirection ? TAB_ORDER[tabIndex + (peekDirection === "next" ? 1 : -1)] : null;

  const applyTransform = useCallback(
    (dx: number) => {
      const container = containerRef.current;
      const pane = paneRef.current;
      if (!container || !pane) return;
      const width = container.clientWidth || 1;
      const idx = tabIndexRef.current;
      const direction: Direction = dx < 0 ? "next" : dx > 0 ? "prev" : null;
      const hasTarget =
        direction === "next" ? idx < TAB_ORDER.length - 1 : direction === "prev" ? idx > 0 : false;

      const coefficient = hasTarget ? VALID_DIRECTION_COEFFICIENT : INVALID_DIRECTION_COEFFICIENT;
      const maxDim = hasTarget ? width * 1.4 : INVALID_DIRECTION_MAX_PX;
      const eased = reducedMotion ? 0 : rubberband(dx, maxDim, coefficient);

      pane.style.transform = `translate3d(${eased}px,0,0)`;

      if (hasTarget && !reducedMotion) {
        if (peekDirectionRef.current !== direction) {
          peekDirectionRef.current = direction;
          setPeekDirection(direction);
        }
        const peek = peekRef.current;
        if (peek) {
          const sign = direction === "next" ? 1 : -1;
          peek.style.transform = `translate3d(${sign * width + eased}px,0,0)`;
        }
      } else if (peekDirectionRef.current !== null) {
        peekDirectionRef.current = null;
        setPeekDirection(null);
      }
    },
    [reducedMotion]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function scheduleFrame() {
      if (gesture.current.frameRequested) return;
      gesture.current.frameRequested = true;
      requestAnimationFrame(() => {
        gesture.current.frameRequested = false;
        applyTransform(gesture.current.lastDx);
      });
    }

    function settle(target: "commit" | "cancel", dx: number, velocity: number) {
      const pane = paneRef.current;
      const peek = peekRef.current;
      const container = containerRef.current;
      if (!pane || !container) return;
      const width = container.clientWidth || 1;
      const direction = peekDirectionRef.current;

      gesture.current.animating = true;
      const generation = ++gesture.current.generation;
      const currentX = readTranslateX(pane);
      const targetX = target === "commit" && direction ? (direction === "next" ? -width : width) : 0;
      const remaining = Math.abs(targetX - currentX);
      const referenceVelocity = Math.max(Math.abs(velocity), 0.6);
      const duration = reducedMotion
        ? 0
        : Math.min(Math.max(remaining / referenceVelocity, SNAP_MIN_MS), SNAP_MAX_MS);

      const transition = duration > 0 ? `transform ${duration}ms ${SNAP_EASE}` : "";
      pane.style.transition = transition;
      pane.style.transform = `translate3d(${targetX}px,0,0)`;
      if (peek && direction) {
        const peekTargetX = target === "commit" ? 0 : (direction === "next" ? width : -width);
        peek.style.transition = transition;
        peek.style.transform = `translate3d(${peekTargetX}px,0,0)`;
      }

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        pane.removeEventListener("transitionend", finish);
        gesture.current.animating = false;
        gesture.current.phase = "idle";

        if (target === "commit" && direction) {
          const idx = tabIndexRef.current;
          const nextPath = TAB_ORDER[idx + (direction === "next" ? 1 : -1)];
          router.push(nextPath);
          // The [pathname] effect handles final cleanup once the real
          // navigation lands; if it never does (offline, error), fall back
          // to clearing the drag visuals so the UI doesn't stay stuck.
          window.setTimeout(() => {
            // Bail if a later gesture has already started its own commit/cancel —
            // this stale fallback must not stomp on it.
            if (!draggingRef.current || gesture.current.generation !== generation) return;
            pane.style.transition = "";
            pane.style.transform = "";
            setDragging(false);
            setPeekDirection(null);
            draggingRef.current = false;
            peekDirectionRef.current = null;
          }, 1200);
        } else {
          pane.style.transition = "";
          pane.style.transform = "";
          setDragging(false);
          setPeekDirection(null);
          draggingRef.current = false;
          peekDirectionRef.current = null;
        }
      };

      if (duration === 0) {
        finish();
      } else {
        // Belt-and-suspenders: transitionend can fail to fire (tab backgrounded,
        // property didn't actually change, browser quirk), which would leave
        // `animating` stuck true and lock out all future gestures.
        pane.addEventListener("transitionend", finish, { once: true });
        window.setTimeout(finish, duration + 100);
      }
    }

    function onTouchStart(e: TouchEvent) {
      if (gesture.current.animating) {
        // A new touch landed mid-snap; mark it inert rather than leaving the
        // previous gesture's stale "horizontal" phase for it to inherit.
        gesture.current.phase = "idle";
        return;
      }
      const touch = e.touches[0];
      gesture.current.phase = "pending";
      gesture.current.startX = touch.clientX;
      gesture.current.startY = touch.clientY;
      gesture.current.startTime = performance.now();
      gesture.current.lastDx = 0;
    }

    function onTouchMove(e: TouchEvent) {
      const g = gesture.current;
      if (g.phase === "idle" || g.animating) return;
      const touch = e.touches[0];
      const dx = touch.clientX - g.startX;
      const dy = touch.clientY - g.startY;

      if (g.phase === "pending") {
        if (Math.hypot(dx, dy) < AXIS_LOCK_DEADZONE_PX) return;
        if (Math.abs(dx) > Math.abs(dy) * AXIS_LOCK_RATIO && tabIndexRef.current !== -1) {
          g.phase = "horizontal";
          if (!draggingRef.current) {
            draggingRef.current = true;
            setDragging(true);
          }
        } else {
          g.phase = "vertical";
          return;
        }
      }

      if (g.phase === "vertical") return;

      // Horizontal intent confirmed — own the gesture from here.
      e.preventDefault();
      g.lastDx = dx;
      scheduleFrame();
    }

    function onTouchEnd(e: TouchEvent) {
      const g = gesture.current;
      if (g.phase !== "horizontal") {
        g.phase = "idle";
        return;
      }
      const touch = e.changedTouches[0];
      const dx = touch.clientX - g.startX;
      const elapsed = Math.max(1, performance.now() - g.startTime);
      const velocity = dx / elapsed;

      const idx = tabIndexRef.current;
      const direction: Direction = dx < 0 ? "next" : dx > 0 ? "prev" : null;
      const hasTarget =
        direction === "next" ? idx < TAB_ORDER.length - 1 : direction === "prev" ? idx > 0 : false;

      const container = containerRef.current;
      const width = container?.clientWidth || 1;
      const distanceCommit = Math.abs(dx) > width * COMMIT_DISTANCE_FRACTION;
      const flickCommit = Math.abs(dx) > MIN_FLICK_DISTANCE_PX && Math.abs(velocity) > COMMIT_VELOCITY_PX_MS;
      const shouldCommit = hasTarget && (distanceCommit || flickCommit);

      settle(shouldCommit ? "commit" : "cancel", dx, velocity);
    }

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [applyTransform, reducedMotion, router]);

  const peekMeta = peekPath ? TAB_META[peekPath] : null;
  const PeekIcon = peekMeta?.icon;

  return (
    <div ref={containerRef} className="relative min-h-full w-full" style={{ touchAction: "pan-y" }}>
      <main
        ref={paneRef}
        className="relative mx-auto min-h-full w-full max-w-lg pb-28"
        style={{ willChange: dragging ? "transform" : undefined }}
      >
        {children}
      </main>

      {dragging && peekDirection && (
        <div
          ref={peekRef}
          className="pointer-events-none absolute inset-0 overflow-hidden"
          // translate3d in % (of this pane's own box) positions it fully
          // off-screen the instant it mounts, before the first rAF-driven
          // pixel-perfect update lands — otherwise it would flash at 0,0
          // (fully overlapping the current page) for one frame.
          style={{ willChange: "transform", transform: `translate3d(${peekDirection === "next" ? "100%" : "-100%"},0,0)` }}
          aria-hidden="true"
        >
          <div className="mx-auto min-h-full w-full max-w-lg pb-28">
            {peekContent ??
              (peekMeta && PeekIcon && (
                <div className={`flex min-h-full items-center justify-center ${peekMeta.gradientClass} opacity-90`}>
                  <PeekIcon className="h-12 w-12 text-white/90" strokeWidth={1.5} />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
