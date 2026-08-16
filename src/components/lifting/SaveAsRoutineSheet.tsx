"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ClientApiError } from "@/lib/client-fetch";

interface SaveAsRoutineSheetProps {
  open: boolean;
  defaultName: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export function SaveAsRoutineSheet({ open, defaultName, onClose, onSave }: SaveAsRoutineSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Save as Routine">
      {/* Keying by open forces a fresh mount (and fresh draft state) each
          time the sheet is opened, instead of syncing state via an effect. */}
      <SaveAsRoutineForm
        key={open ? defaultName : "closed"}
        defaultName={defaultName}
        onClose={onClose}
        onSave={onSave}
      />
    </Sheet>
  );
}

function SaveAsRoutineForm({ defaultName, onClose, onSave }: Omit<SaveAsRoutineSheetProps, "open">) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      setError("Routine name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to save routine.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-secondary">
        This workout&rsquo;s exercises and set counts will be saved as a reusable routine.
      </p>
      <Input
        id="routine-name"
        label="Routine Name"
        placeholder="e.g. Push Day"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button size="lg" fullWidth onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Routine"}
      </Button>
    </div>
  );
}
