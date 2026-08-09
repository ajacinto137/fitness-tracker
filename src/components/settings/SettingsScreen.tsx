"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Download, Check } from "lucide-react";
import type { Units } from "@prisma/client";
import { SubPageHeader } from "@/components/nav/SubPageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/components/theme/ThemeProvider";
import { apiSend, ClientApiError } from "@/lib/client-fetch";
import { COLOR_SCHEMES, COLOR_SCHEME_META } from "@/lib/color-schemes";
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
  const { scheme, setScheme } = useTheme();
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
                  units === u ? "bg-gradient-primary text-accent-ink" : "text-ink-secondary hover:text-ink"
                )}
              >
                {u === "LB" ? "Pounds (lb)" : "Kilograms (kg)"}
              </button>
            ))}
          </Card>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-ink-secondary">Appearance</h2>
          <Card className="space-y-2 p-3">
            <p className="px-1 text-xs text-ink-muted">Color Scheme</p>
            <div className="grid grid-cols-1 gap-2">
              {COLOR_SCHEMES.map((s) => {
                const meta = COLOR_SCHEME_META[s];
                const selected = s === scheme;
                return (
                  <button
                    key={s}
                    onClick={() => setScheme(s)}
                    aria-pressed={selected}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      selected ? "border-accent bg-surface-hover" : "border-border-strong hover:bg-surface-hover"
                    )}
                  >
                    <span
                      className="h-9 w-9 shrink-0 rounded-full"
                      style={{ backgroundImage: meta.preview }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{meta.label}</span>
                      <span className="block truncate text-xs text-ink-muted">{meta.description}</span>
                    </span>
                    {selected && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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
