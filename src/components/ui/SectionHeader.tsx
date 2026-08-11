import Link from "next/link";
import { clsx } from "clsx";

export type HeadingCategory = "strength" | "weight" | "success" | "achievement";

const headingColorClass: Record<HeadingCategory, string> = {
  strength: "text-strength-soft",
  weight: "text-weight-soft",
  success: "text-success",
  achievement: "text-gold-soft",
};

export function SectionHeader({
  title,
  href,
  seeAllLabel = "See all",
  category,
  action,
}: {
  title: string;
  href?: string;
  seeAllLabel?: string;
  category?: HeadingCategory;
  /** Optional control (e.g. a "create" button) rendered before the "See all" link. */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className={clsx("font-semibold", category ? headingColorClass[category] : "text-ink")}>
        {title}
      </h2>
      <div className="flex items-center gap-3">
        {action}
        {href && (
          <Link href={href} className="text-sm font-medium text-accent">
            {seeAllLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
