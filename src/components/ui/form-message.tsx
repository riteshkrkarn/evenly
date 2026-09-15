"use client";

import { cn } from "@/lib/utils";

export function FormMessage({
  error,
  success,
  className,
}: {
  error?: string;
  success?: string;
  className?: string;
}) {
  if (!error && !success) return null;

  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          "rounded-sm border border-danger/35 bg-[color-mix(in_oklch,var(--danger)_10%,transparent)] px-3 py-2.5 text-sm leading-relaxed text-danger",
          className
        )}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "rounded-sm border border-accent/35 bg-[color-mix(in_oklch,var(--accent)_10%,transparent)] px-3 py-2.5 text-sm leading-relaxed text-ink",
        className
      )}
    >
      {success}
    </div>
  );
}
