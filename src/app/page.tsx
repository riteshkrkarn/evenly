import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { auth } from "@/auth";

const boardRows = [
  {
    initial: "P",
    name: "Priya",
    status: "↑ you are owed",
    amount: "₹420",
    featured: true,
  },
  {
    initial: "M",
    name: "Marco",
    status: "↓ you owe",
    amount: "₹180",
    featured: false,
  },
  {
    initial: "L",
    name: "Lena",
    status: "settled",
    amount: "₹0",
    featured: false,
  },
] as const;

const wayfinding = [
  { label: "Accurate", detail: "Balances from every expense" },
  { label: "Private", detail: "Just your group" },
  { label: "Clear", detail: "Who owes whom, instantly" },
] as const;

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col md:flex-row">
        <aside className="flex w-full shrink-0 flex-col justify-between gap-10 border-b border-border bg-surface px-8 py-10 md:w-[32%] md:border-b-0 md:border-r lg:px-10">
          <div>
            <p className="text-[3rem] font-extrabold leading-none tracking-tight text-ink">
              Evenly
            </p>
            <span aria-hidden className="mt-3 block h-1 w-14 bg-primary" />
            <p className="mt-8 max-w-60 text-[1.5rem] font-medium leading-snug text-ink">
              Split shared costs.
              <br />
              Trust the numbers.
            </p>

            <nav className="mt-12" aria-label="Product">
              <p className="label-caps">Wayfinding</p>
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {wayfinding.map((item) => (
                  <li key={item.label}>
                    <a
                      href="#board"
                      className="flex items-center justify-between gap-3 py-3.5 text-sm font-semibold text-ink transition-colors hover:text-primary"
                    >
                      <span>
                        {item.label}
                        <span className="mt-0.5 block text-xs font-normal text-muted">
                          {item.detail}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div>
            <Link
              href="/register"
              className="flex h-15 w-full items-center justify-center bg-primary text-sm font-semibold text-primary-fg transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink transition-colors hover:text-primary"
            >
              Log in
              <ChevronRight className="h-4 w-4" />
            </Link>
            <p className="mt-8 text-[0.6875rem] text-muted">
              Evenly · small groups · no payment gateway
            </p>
          </div>
        </aside>

        <section
          id="board"
          className="flex min-w-0 flex-1 flex-col bg-bg px-8 py-10 lg:px-12"
        >
          <p className="label-caps text-ink">Live balance</p>

          <table className="mt-8 w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                <th className="pb-3 pr-4 font-semibold">Name</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {boardRows.map((row) => (
                <tr
                  key={row.name}
                  className={
                    row.featured
                      ? "border-b border-border border-l-[3px] border-l-primary bg-(--owed-wash)"
                      : "border-b border-border"
                  }
                >
                  <td className="py-6 pl-4 pr-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          row.featured
                            ? "flex h-9 w-9 shrink-0 items-center justify-center border border-primary text-sm font-bold text-primary"
                            : "flex h-9 w-9 shrink-0 items-center justify-center border border-border text-sm font-semibold text-muted"
                        }
                      >
                        {row.initial}
                      </span>
                      <span
                        className={
                          row.featured
                            ? "font-semibold text-primary"
                            : "font-semibold text-ink"
                        }
                      >
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td
                    className={
                      row.featured
                        ? "py-6 pr-4 text-sm font-semibold text-primary"
                        : "py-6 pr-4 text-sm text-muted"
                    }
                  >
                    {row.status}
                  </td>
                  <td
                    className={
                      row.featured
                        ? "money py-6 text-right text-3xl text-primary"
                        : "money py-6 text-right text-2xl text-ink"
                    }
                  >
                    {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">
              Balances update as payments and expenses are added.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:text-primary"
            >
              View full report
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
