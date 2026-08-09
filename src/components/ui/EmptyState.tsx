import type { LucideIcon } from "lucide-react";
import { IconContainer, type IconCategory } from "@/components/ui/IconContainer";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  category = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  category?: IconCategory;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong px-6 py-10 text-center">
      <IconContainer icon={Icon} category={category} size="lg" />
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}
