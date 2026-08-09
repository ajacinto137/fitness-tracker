import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";
type Gradient = "primary" | "strength" | "weight" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Only applies to variant="primary" — picks which category gradient/glow the CTA uses. */
  gradient?: Gradient;
}

const variantClasses: Record<Exclude<Variant, "primary">, string> = {
  secondary:
    "bg-surface-2 text-ink border border-border-strong hover:bg-surface-hover disabled:text-ink-disabled",
  ghost: "bg-transparent text-ink hover:bg-surface-2 disabled:text-ink-disabled",
  danger: "bg-danger-strong text-white hover:bg-danger disabled:bg-surface-2 disabled:text-ink-disabled",
};

const gradientBgClass: Record<Gradient, string> = {
  primary: "bg-gradient-primary",
  strength: "bg-gradient-strength",
  weight: "bg-gradient-weight",
  success: "bg-gradient-success",
};

const gradientTextClass: Record<Gradient, string> = {
  primary: "text-accent-ink",
  strength: "text-white",
  weight: "text-white",
  success: "text-white",
};

const gradientGlowClass: Record<Gradient, string> = {
  primary: "glow-primary",
  strength: "glow-strength",
  weight: "glow-weight",
  success: "glow-success",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-12 px-5 text-base rounded-xl",
  lg: "h-14 px-6 text-lg rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", gradient = "primary", fullWidth, className, disabled, ...props }, ref) => {
    const isPrimary = variant === "primary";
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
          isPrimary &&
            (disabled
              ? "bg-surface-2 text-ink-disabled"
              : clsx(
                  gradientBgClass[gradient],
                  gradientTextClass[gradient],
                  gradientGlowClass[gradient],
                  "hover:brightness-110"
                )),
          !isPrimary && variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
