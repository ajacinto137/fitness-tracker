"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { clsx } from "clsx";

const PIXELS_PER_SECOND = 40;
const MIN_DURATION_S = 4;

/**
 * Renders text truncated with an ellipsis, unless it overflows its
 * container — then it loops in a leftward scroll so the full text stays
 * readable without needing more horizontal space.
 */
export function MarqueeText({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [duration, setDuration] = useState(MIN_DURATION_S);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    function check() {
      const textWidth = measure!.scrollWidth;
      setOverflowing(textWidth > container!.clientWidth + 1);
      setDuration(Math.max(MIN_DURATION_S, textWidth / PIXELS_PER_SECOND));
    }

    check();
    const observer = new ResizeObserver(check);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div ref={containerRef} className={clsx("relative min-w-0 overflow-hidden", className)}>
      <span ref={measureRef} className="invisible absolute whitespace-nowrap" aria-hidden>
        {text}
      </span>
      {overflowing ? (
        <div className="animate-marquee flex w-max" style={{ animationDuration: `${duration}s` }}>
          <span className="whitespace-nowrap pr-10">{text}</span>
          <span className="whitespace-nowrap pr-10" aria-hidden="true">
            {text}
          </span>
        </div>
      ) : (
        <span className="block truncate">{text}</span>
      )}
    </div>
  );
}
