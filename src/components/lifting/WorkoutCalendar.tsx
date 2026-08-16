"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { displayDate } from "@/lib/date";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function dayKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function WorkoutCalendar({ workouts }: { workouts: { id: string; startedAt: string }[] }) {
  const router = useRouter();
  const [dayPicker, setDayPicker] = useState<{ id: string; startedAt: string }[] | null>(null);

  const workoutsByDay = useMemo(() => {
    const map = new Map<string, { id: string; startedAt: string }[]>();
    for (const w of workouts) {
      const d = new Date(w.startedAt);
      const key = dayKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      const existing = map.get(key);
      if (existing) existing.push(w);
      else map.set(key, [w]);
    }
    return map;
  }, [workouts]);

  function handleDayClick(key: string) {
    const dayWorkouts = workoutsByDay.get(key);
    if (!dayWorkouts || dayWorkouts.length === 0) return;
    if (dayWorkouts.length === 1) {
      router.push(`/lifting/workout/${dayWorkouts[0].id}`);
    } else {
      setDayPicker(dayWorkouts);
    }
  }

  const today = new Date();
  const todayYear = today.getUTCFullYear();
  const todayMonth = today.getUTCMonth();
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);

  const isCurrentMonth = viewYear === todayYear && viewMonth === todayMonth;

  const { cells, monthLabel } = useMemo(() => {
    const firstOfMonth = new Date(Date.UTC(viewYear, viewMonth, 1));
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    const leadingBlanks = (firstOfMonth.getUTCDay() + 6) % 7; // Monday-start offset

    const cells: { day: number | null; key: string | null }[] = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push({ day: null, key: null });
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, key: dayKey(viewYear, viewMonth, day) });
    }

    const monthLabel = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(firstOfMonth);

    return { cells, monthLabel };
  }, [viewYear, viewMonth]);

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (isCurrentMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-strength-soft">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className="text-xs font-medium text-ink-muted">
            {label}
          </span>
        ))}
        {cells.map((cell, i) => {
          if (cell.day === null) return <span key={i} />;
          const workedOut = workoutsByDay.has(cell.key!);
          const isToday = cell.key === dayKey(todayYear, todayMonth, today.getUTCDate());
          return (
            <div key={i} className="flex items-center justify-center py-0.5">
              <button
                type="button"
                onClick={() => handleDayClick(cell.key!)}
                disabled={!workedOut}
                aria-label={workedOut ? `View workout on ${cell.key}` : undefined}
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm",
                  workedOut && "bg-gradient-strength font-semibold text-white hover:opacity-90",
                  !workedOut && isToday && "border border-strength-soft text-ink",
                  !workedOut && !isToday && "text-ink-secondary",
                  !workedOut && "cursor-default"
                )}
              >
                {cell.day}
              </button>
            </div>
          );
        })}
      </div>

      <Sheet open={!!dayPicker} onClose={() => setDayPicker(null)} title="Workouts">
        <div className="space-y-2">
          {dayPicker?.map((w) => (
            <button
              key={w.id}
              onClick={() => router.push(`/lifting/workout/${w.id}`)}
              className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-surface-hover"
            >
              {displayDate(w.startedAt, { hour: "numeric", minute: "2-digit" })}
            </button>
          ))}
        </div>
      </Sheet>
    </Card>
  );
}
