import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

export type BadgeVariant = "neutral" | "strength" | "weight" | "success" | "achievement" | "danger";

const variantClass: Record<BadgeVariant, string> = {
  neutral: "bg-surface-2 text-ink-secondary",
  strength: "bg-strength-wash text-strength-soft",
  weight: "bg-weight-wash text-weight-soft",
  success: "bg-success-wash text-success",
  achievement: "bg-gradient-achievement text-accent-ink glow-gold",
  danger: "bg-danger/15 text-danger",
};

export function Badge({
  children,
  variant = "neutral",
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        variantClass[variant],
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
