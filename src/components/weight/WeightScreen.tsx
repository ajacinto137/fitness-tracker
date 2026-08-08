"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Scale } from "lucide-react";
import type { Units } from "@prisma/client";
import { TopBar } from "@/components/nav/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LogWeightSheet, type WeightFormValues } from "@/components/weight/LogWeightSheet";
import { ProgressChart, type ChartPoint } from "@/components/charts/ProgressChart";
import { TimeRangeTabs } from "@/components/charts/TimeRangeTabs";
import { useToast } from "@/components/ui/Toast";
import { apiSend, ClientApiError } from "@/lib/client-fetch";
import { fromKg, roundWeight, unitLabel } from "@/lib/units";
import { movingAverage, startDateForRange, type TimeRangeKey } from "@/lib/calculations";
import { computeWeightStats } from "@/lib/weight-stats";
import { displayDate, formatDateOnly } from "@/lib/date";

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  note: string | null;
}

export function WeightScreen({
  initialEntries,
  units,
}: {
  initialEntries: WeightEntry[];
  units: Units;
}) {
  const { show } = useToast();
  const [entries, setEntries] = useState(initialEntries);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<WeightEntry | null>(null);
  const [deleting, setDeleting] = useState<WeightEntry | null>(null);
  const [range, setRange] = useState<TimeRangeKey>("3M");

  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [entries]
  );

  const stats = useMemo(() => computeWeightStats(sorted), [sorted]);

  const chartData: ChartPoint[] = useMemo(() => {
    const startDate = startDateForRange(range);
    const points = sorted.map((e) => ({ date: new Date(e.date), value: fromKg(e.weightKg, units) }));
    const withAverage = movingAverage(points, 7);
    return sorted
      .map((e, i) => ({
        date: e.date,
        actual: roundWeight(fromKg(e.weightKg, units)),
        trend: roundWeight(withAverage[i].value),
      }))
      .filter((p) => !startDate || new Date(p.date) >= startDate);
  }, [sorted, units, range]);

  const recent = [...sorted].reverse().slice(0, 15);

  async function createEntry(values: { weight: number; date: string; note: string | null }) {
    const { entry } = await apiSend<{ entry: { id: string; date: string; weightKg: number; note: string | null } }>(
      "/api/weight",
      "POST",
      values
    );
    setEntries((prev) => [...prev, entry]);
  }

  async function updateEntry(id: string, values: { weight: number; date: string; note: string | null }) {
    const { entry } = await apiSend<{ entry: { id: string; date: string; weightKg: number; note: string | null } }>(
      `/api/weight/${id}`,
      "PATCH",
      values
    );
    setEntries((prev) => prev.map((e) => (e.id === id ? entry : e)));
  }

  async function confirmDelete() {
    if (!deleting) return;
    const removed = deleting;
    setEntries((prev) => prev.filter((e) => e.id !== removed.id));
    setDeleting(null);
    try {
      await apiSend(`/api/weight/${removed.id}`, "DELETE");
      show("Weight entry deleted", {
        actionLabel: "Undo",
        onAction: async () => {
          try {
            await createEntry({
              weight: fromKg(removed.weightKg, units),
              date: formatDateOnly(removed.date),
              note: removed.note,
            });
          } catch {
            show("Couldn't restore entry", { variant: "error" });
          }
        },
      });
    } catch (err) {
      setEntries((prev) => [...prev, removed]);
      show(err instanceof ClientApiError ? err.message : "Unable to delete entry.", {
        variant: "error",
      });
    }
  }

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(entry: WeightEntry) {
    setEditing(entry);
    setSheetOpen(true);
  }

  function formatDelta(kg: number | null) {
    if (kg === null) return "—";
    const value = roundWeight(Math.abs(fromKg(kg, units)));
    if (value === 0) return `0 ${unitLabel(units)}`;
    return `${kg > 0 ? "+" : "-"}${value} ${unitLabel(units)}`;
  }

  const initialFormValues: WeightFormValues | undefined = editing
    ? {
        weight: String(roundWeight(fromKg(editing.weightKg, units))),
        date: formatDateOnly(editing.date),
        note: editing.note ?? "",
      }
    : undefined;

  return (
    <div>
      <TopBar title="Weight" />
      <div className="space-y-6 px-5 py-5">
        {stats ? (
          <Card className="space-y-5">
            <div>
              <p className="text-sm font-medium text-ink-secondary">Current Weight</p>
              <p className="text-4xl font-bold tracking-tight text-ink">
                {roundWeight(fromKg(stats.current, units))}
                <span className="ml-1 text-lg font-medium text-ink-secondary">
                  {unitLabel(units)}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <DeltaStat label="Prev" delta={stats.changeFromPrevious} formatDelta={formatDelta} />
              <DeltaStat label="7 days" delta={stats.change7d} formatDelta={formatDelta} />
              <DeltaStat label="30 days" delta={stats.change30d} formatDelta={formatDelta} />
            </div>
            <Button size="lg" fullWidth onClick={openCreate}>
              <Plus className="h-5 w-5" /> Log Weight
            </Button>
          </Card>
        ) : (
          <EmptyState
            icon={Scale}
            title="No weight entries yet"
            description="Log your weight to start seeing your trend."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-5 w-5" /> Log Weight
              </Button>
            }
          />
        )}

        {sorted.length > 1 && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Trend</h2>
              <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-secondary" /> Actual
                <span className="ml-2 h-1.5 w-3 rounded-full bg-accent-soft" /> 7-day avg
              </div>
            </div>
            <ProgressChart
              data={chartData}
              series={[
                { dataKey: "actual", label: "Actual", color: "var(--ink-secondary)", style: "dots" },
                { dataKey: "trend", label: "7-day avg", color: "var(--accent-soft)", style: "line" },
              ]}
              valueFormatter={(v) => `${v} ${unitLabel(units)}`}
            />
            <TimeRangeTabs value={range} onChange={setRange} />
          </Card>
        )}

        {recent.length > 0 && (
          <div className="space-y-2">
            <h2 className="px-1 font-semibold text-ink">Recent Entries</h2>
            <div className="space-y-2">
              {recent.map((entry) => (
                <Card key={entry.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-ink">
                      {roundWeight(fromKg(entry.weightKg, units))} {unitLabel(units)}
                    </p>
                    <p className="text-sm text-ink-secondary">
                      {displayDate(entry.date, { year: "numeric" })}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(entry)}
                      aria-label="Edit entry"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(entry)}
                      aria-label="Delete entry"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <LogWeightSheet
        open={sheetOpen}
        units={units}
        initial={initialFormValues}
        onClose={() => setSheetOpen(false)}
        onSubmit={(values) => (editing ? updateEntry(editing.id, values) : createEntry(values))}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete entry?"
        description="This weight entry will be permanently removed."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function DeltaStat({
  label,
  delta,
  formatDelta,
}: {
  label: string;
  delta: number | null;
  formatDelta: (kg: number | null) => string;
}) {
  const Icon = delta === null || delta === 0 ? null : delta > 0 ? ArrowUp : ArrowDown;
  return (
    <div>
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className="mt-0.5 flex items-center justify-center gap-0.5 text-sm font-semibold text-ink">
        {Icon && <Icon className="h-3.5 w-3.5 text-ink-secondary" />}
        {formatDelta(delta)}
      </p>
    </div>
  );
}
