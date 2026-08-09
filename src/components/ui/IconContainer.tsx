import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

export type IconCategory = "primary" | "strength" | "weight" | "success" | "achievement" | "neutral";

const gradientClass: Record<IconCategory, string> = {
  primary: "bg-gradient-primary",
  strength: "bg-gradient-strength",
  weight: "bg-gradient-weight",
  success: "bg-gradient-success",
  achievement: "bg-gradient-achievement glow-gold",
  neutral: "bg-surface-2",
};

const iconColorClass: Record<IconCategory, string> = {
  primary: "text-accent-ink",
  strength: "text-white",
  weight: "text-white",
  success: "text-accent-ink",
  achievement: "text-accent-ink",
  neutral: "text-ink-secondary",
};

const containerSizeClass = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
  lg: "h-12 w-12 rounded-xl",
};

const iconSizeClass = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function IconContainer({
  icon: Icon,
  category = "neutral",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  category?: IconCategory;
  size?: keyof typeof containerSizeClass;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center",
        containerSizeClass[size],
        gradientClass[category],
        className
      )}
    >
      <Icon className={clsx(iconSizeClass[size], iconColorClass[category])} />
    </div>
  );
}
