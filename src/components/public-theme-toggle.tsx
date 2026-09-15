"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

/** Theme control for pages outside the authenticated app shell. */
export function PublicThemeToggle() {
  const pathname = usePathname();
  const inAppShell =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/friends") ||
    pathname.startsWith("/transfers") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/groups");

  if (inAppShell) return null;

  return (
    <div
      className="fixed z-50 rounded-sm border border-border bg-surface/95 shadow-[0_1px_2px_var(--shadow)] backdrop-blur-sm"
      style={{
        top: "max(0.75rem, env(safe-area-inset-top))",
        right: "max(0.75rem, env(safe-area-inset-right))",
      }}
    >
      <ThemeToggle />
    </div>
  );
}
