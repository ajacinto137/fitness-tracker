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
}: {
  title: string;
  href?: string;
  seeAllLabel?: string;
  category?: HeadingCategory;
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className={clsx("font-semibold", category ? headingColorClass[category] : "text-ink")}>
        {title}
      </h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-accent">
          {seeAllLabel}
        </Link>
      )}
    </div>
  );
}
