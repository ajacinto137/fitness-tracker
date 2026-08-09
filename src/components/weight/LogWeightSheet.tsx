"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { todayDateOnly } from "@/lib/date";
import { unitLabel } from "@/lib/units";
import type { Units } from "@prisma/client";

export interface WeightFormValues {
  weight: string;
  date: string;
  note: string;
}

interface LogWeightSheetProps {
  open: boolean;
  units: Units;
  initial?: WeightFormValues;
  onClose: () => void;
  onSubmit: (values: { weight: number; date: string; note: string | null }) => Promise<void>;
}

export function LogWeightSheet({ open, units, initial, onClose, onSubmit }: LogWeightSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={initial ? "Edit Weight" : "Log Weight"}>
      {/* Keying by open+initial forces a fresh mount (and fresh initial state)
          each time the sheet is opened, instead of syncing state via an effect. */}
      <LogWeightForm
        key={open ? initial?.date ?? "new" : "closed"}
        units={units}
        initial={initial}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Sheet>
  );
}

function LogWeightForm({
  units,
  initial,
  onClose,
  onSubmit,
}: Omit<LogWeightSheetProps, "open">) {
  const [weight, setWeight] = useState(initial?.weight ?? "");
  const [date, setDate] = useState(initial?.date ?? todayDateOnly());
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(weight);
    if (!weight || Number.isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid weight greater than 0.");
      return;
    }
    if (!date) {
      setError("Enter a valid date.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ weight: parsed, date, note: note.trim() || null });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save weight entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="weight"
        label={`Weight (${unitLabel(units)})`}
        type="number"
        inputMode="decimal"
        step="0.1"
        min="0"
        placeholder="0.0"
        autoFocus
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />
      <Input
        id="date"
        label="Date"
        type="date"
        value={date}
        max={todayDateOnly()}
        onChange={(e) => setDate(e.target.value)}
      />
      <Textarea
        id="note"
        label="Note (optional)"
        placeholder="e.g. after workout, fasted"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" fullWidth size="lg" gradient="weight" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
