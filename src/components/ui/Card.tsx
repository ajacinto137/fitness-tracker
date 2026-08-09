import { clsx } from "clsx";

export type CardAccent = "none" | "strength" | "weight" | "success" | "achievement" | "primary";

const accentBorderClass: Record<CardAccent, string> = {
  none: "border-border",
  strength: "border-strength-wash",
  weight: "border-weight-wash",
  success: "border-success-wash",
  achievement: "border-gold-wash",
  primary: "border-accent-wash",
};

const accentStripClass: Record<Exclude<CardAccent, "none">, string> = {
  strength: "bg-gradient-strength",
  weight: "bg-gradient-weight",
  success: "bg-gradient-success",
  achievement: "bg-gradient-achievement",
  primary: "bg-gradient-primary",
};

// Reserved for the two contexts that call for a card-level glow: the
// current/active exercise and personal-record moments. Other accents keep
// the strip + tinted border only, so glow stays a deliberate signal.
const accentGlowClass: Partial<Record<CardAccent, string>> = {
  primary: "glow-primary",
  achievement: "glow-gold",
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: CardAccent;
  elevated?: boolean;
}

export function Card({ className, children, accent = "none", elevated = false, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border p-4",
        accentBorderClass[accent],
        accentGlowClass[accent],
        elevated ? "bg-surface-elevated" : "bg-surface shadow-sm shadow-black/20",
        className
      )}
      {...props}
    >
      {accent !== "none" && (
        <span className={clsx("absolute inset-y-0 left-0 w-1", accentStripClass[accent])} aria-hidden />
      )}
      {children}
    </div>
  );
}
