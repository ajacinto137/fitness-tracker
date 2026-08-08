"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Download } from "lucide-react";
import type { Units } from "@prisma/client";
import { SubPageHeader } from "@/components/nav/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { apiSend, ClientApiError } from "@/lib/client-fetch";
import { clsx } from "clsx";

export function SettingsScreen({
  initialName,
  email,
  memberSince,
  initialUnits,
}: {
  initialName: string;
  email: string;
  memberSince: string;
  initialUnits: Units;
}) {
  const { show } = useToast();
  const [name, setName] = useState(initialName);
  const [units, setUnits] = useState<Units>(initialUnits);
  const [savingName, setSavingName] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function saveName() {
    setSavingName(true);
    try {
      await apiSend("/api/settings", "PATCH", { name });
      show("Profile updated");
    } catch (err) {
      show(err instanceof ClientApiError ? err.message : "Unable to update profile.", {
        variant: "error",
      });
    } finally {
      setSavingName(false);
    }
  }

  async function changeUnits(next: Units) {
    if (next === units) return;
    setUnits(next);
    try {
      await apiSend("/api/settings", "PATCH", { units: next });
    } catch (err) {
      setUnits(units);
      show(err instanceof ClientApiError ? err.message : "Unable to update units.", {
        variant: "error",
      });
    }
  }

  return (
    <div>
      <SubPageHeader title="Settings" fallbackHref="/weight" />
      <div className="space-y-6 px-5 py-5">
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-ink-secondary">Profile</h2>
          <Card className="space-y-3">
            <Input
              id="name"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button size="sm" onClick={saveName} disabled={savingName || !name.trim()}>
              {savingName ? "Saving..." : "Save"}
            </Button>
          </Card>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-ink-secondary">Preferred Units</h2>
          <Card className="flex gap-1 p-1">
            {(["LB", "KG"] as Units[]).map((u) => (
              <button
                key={u}
                onClick={() => changeUnits(u)}
                className={clsx(
                  "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors",
                  units === u ? "bg-accent-strong text-white" : "text-ink-secondary hover:text-ink"
                )}
              >
                {u === "LB" ? "Pounds (lb)" : "Kilograms (kg)"}
              </button>
            ))}
          </Card>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-ink-secondary">Account</h2>
          <Card className="space-y-1">
            <p className="text-sm text-ink-secondary">Email</p>
            <p className="font-medium text-ink">{email}</p>
            <p className="mt-2 text-xs text-ink-muted">
              Member since {new Date(memberSince).toLocaleDateString()}
            </p>
          </Card>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-ink-secondary">Export Data</h2>
          <Card className="space-y-1 p-2">
            <ExportLink href="/api/export/weight" label="Body Weight History" />
            <ExportLink href="/api/export/workouts" label="Workout History" />
            <ExportLink href="/api/export/sets" label="Exercise Set History" />
          </Card>
        </section>

        <Button
          variant="secondary"
          fullWidth
          disabled={loggingOut}
          onClick={() => {
            setLoggingOut(true);
            signOut({ callbackUrl: "/login" });
          }}
        >
          <LogOut className="h-4 w-4" /> {loggingOut ? "Signing out..." : "Log Out"}
        </Button>
      </div>
    </div>
  );
}

function ExportLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-ink-secondary hover:bg-surface-2 hover:text-ink"
    >
      {label}
      <Download className="h-4 w-4" />
    </a>
  );
}
