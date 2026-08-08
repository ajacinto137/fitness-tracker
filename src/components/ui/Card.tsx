import { clsx } from "clsx";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-2xl border border-border bg-surface p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
