import Link from "next/link";
import { type ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-bg hover:bg-white/90 focus-visible:ring-white/40",
  secondary:
    "border border-white/25 bg-transparent text-text hover:border-white/50 hover:bg-white/5 focus-visible:ring-white/30",
  accent:
    "bg-accent text-white hover:bg-[#a80f16] focus-visible:ring-accent/40",
  ghost:
    "bg-transparent text-text-muted hover:text-text focus-visible:ring-white/20",
};

type ButtonProps = {
  variant?: ButtonVariant;
  href?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "className">;

const base =
  "inline-flex items-center justify-center gap-2 rounded-none px-7 py-3.5 text-sm font-medium tracking-wide transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export function Button({
  variant = "primary",
  href,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
