import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-16">
      <Link
        href="/"
        className="mb-10 font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-text"
      >
        Tuned &amp; Threaded
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text">
        {title}
      </h1>
      <p className="mt-2 text-sm text-text-muted">{subtitle}</p>
      <div className="mt-8 space-y-6 rounded-none border border-border bg-surface p-6 sm:p-8">
        {children}
      </div>
      {footer ? <div className="mt-6 text-center text-sm text-text-muted">{footer}</div> : null}
    </div>
  );
}
