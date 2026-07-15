import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-foreground text-background hover:bg-zinc-200 active:bg-zinc-300",
  secondary:
    "bg-accent-soft text-accent hover:bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]",
  ghost: "bg-transparent text-foreground-muted hover:text-foreground hover:bg-white/5",
  outline:
    "border border-border-strong bg-transparent text-foreground hover:bg-white/[0.04]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs tracking-[0.04em]",
  md: "h-11 px-5 text-sm tracking-[0.03em]",
  lg: "h-12 px-6 text-sm tracking-[0.04em]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium uppercase transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
