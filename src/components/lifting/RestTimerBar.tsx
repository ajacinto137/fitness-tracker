"use client";

import { useEffect, useRef, useState } from "react";
import { Timer, X, Plus } from "lucide-react";
import { clsx } from "clsx";

const PRESETS = [
  { label: "60s", seconds: 60 },
  { label: "90s", seconds: 90 },
  { label: "2m", seconds: 120 },
  { label: "3m", seconds: 180 },
];

function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio isn't available in every environment; failing silently is fine here.
  }
}

export function RestTimerBar() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(90);
  const chimedRef = useRef(false);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (!chimedRef.current) {
        chimedRef.current = true;
        playChime();
      }
      return;
    }
    chimedRef.current = false;
    const timeout = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(timeout);
  }, [secondsLeft]);

  function start(seconds: number) {
    setTotalSeconds(seconds);
    setSecondsLeft(seconds);
  }

  if (secondsLeft === null) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-border bg-surface p-2">
        <Timer className="ml-1 h-4 w-4 shrink-0 text-ink-muted" />
        {PRESETS.map((p) => (
          <button
            key={p.seconds}
            onClick={() => start(p.seconds)}
            className="shrink-0 rounded-xl bg-surface-2 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:text-ink"
          >
            Rest {p.label}
          </button>
        ))}
      </div>
    );
  }

  const progress = 1 - secondsLeft / totalSeconds;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent-strong bg-surface p-3">
      <div
        className="absolute inset-y-0 left-0 bg-accent-wash transition-all"
        style={{ width: `${Math.min(100, progress * 100)}%` }}
      />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-accent-soft" />
          <span className="text-lg font-semibold tabular-nums text-ink">
            {secondsLeft <= 0 ? "Rest done" : `${minutes}:${String(seconds).padStart(2, "0")}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.seconds}
              onClick={() => start(p.seconds)}
              className={clsx(
                "rounded-lg px-2 py-1 text-xs font-medium text-ink-secondary hover:text-ink",
                totalSeconds === p.seconds && "text-accent-soft"
              )}
            >
              <Plus className="mb-0.5 inline h-3 w-3" />
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setSecondsLeft(null)}
            aria-label="Dismiss timer"
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
