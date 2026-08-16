"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ClientApiError } from "@/lib/client-fetch";

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

interface EditWorkoutTimeSheetProps {
  open: boolean;
  startedAt: string;
  finishedAt: string | null;
  onClose: () => void;
  onSave: (patch: { startedAt: string; finishedAt: string | null }) => Promise<void>;
}

export function EditWorkoutTimeSheet({ open, startedAt, finishedAt, onClose, onSave }: EditWorkoutTimeSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Edit Workout Time">
      {/* Keying by open forces a fresh mount (and fresh draft state) each
          time the sheet is opened, instead of syncing state via an effect. */}
      <EditWorkoutTimeForm
        key={open ? `${startedAt}-${finishedAt ?? "open"}` : "closed"}
        startedAt={startedAt}
        finishedAt={finishedAt}
        onClose={onClose}
        onSave={onSave}
      />
    </Sheet>
  );
}

function EditWorkoutTimeForm({
  startedAt,
  finishedAt,
  onClose,
  onSave,
}: Omit<EditWorkoutTimeSheetProps, "open">) {
  const [startInput, setStartInput] = useState(toDatetimeLocal(startedAt));
  const [finishInput, setFinishInput] = useState(finishedAt ? toDatetimeLocal(finishedAt) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const start = new Date(startInput);
    const finish = finishedAt !== null ? new Date(finishInput) : null;

    if (Number.isNaN(start.getTime()) || (finish && Number.isNaN(finish.getTime()))) {
      setError("Enter a valid date and time.");
      return;
    }
    if (start.getTime() > Date.now()) {
      setError("Start time can't be in the future.");
      return;
    }
    if (finish && start.getTime() > finish.getTime()) {
      setError("Start time must be before finish time.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave({ startedAt: start.toISOString(), finishedAt: finish ? finish.toISOString() : null });
      onClose();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Input
        label="Started at"
        type="datetime-local"
        value={startInput}
        onChange={(e) => setStartInput(e.target.value)}
      />
      {finishedAt !== null && (
        <Input
          label="Finished at"
          type="datetime-local"
          value={finishInput}
          onChange={(e) => setFinishInput(e.target.value)}
        />
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button size="lg" fullWidth onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
