import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { BalanceList } from "@/components/balance-list";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { db } from "@/db";
import { expenseSplits, expenses } from "@/db/schema";
import {
  assertGroupMember,
  getGroupBalances,
  getGroupMembers,
  getGroupOrThrow,
} from "@/lib/group-data";
import { formatMoney } from "@/lib/utils";

function parseMonth(value: string | undefined): { year: number; month: number } {
  const now = new Date();
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12
  ) {
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  }
  return { year, month };
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
  };
}

function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function GroupMonthlySummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    await assertGroupMember(id, session.user.id);
  } catch {
    notFound();
  }

  const { year, month } = parseMonth(sp.month);
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const userId = session.user.id;

  const [group, members, balances] = await Promise.all([
    getGroupOrThrow(id),
    getGroupMembers(id),
    getGroupBalances(id),
  ]);
  const nameById = Object.fromEntries(members.map((m) => [m.userId, m.name]));

  const monthFilter = and(
    eq(expenses.groupId, id),
    isNull(expenses.deletedAt),
    sql`strftime('%Y-%m', ${expenses.date} / 1000, 'unixepoch') = ${monthKey}`
  );

  const [totalRow, shareRow, categoryRows] = await Promise.all([
    db
      .select({
        total: sql<number>`coalesce(sum(${expenses.amount}), 0)`.mapWith(Number),
      })
      .from(expenses)
      .where(monthFilter)
      .get(),
    db
      .select({
        total: sql<number>`coalesce(sum(${expenseSplits.amount}), 0)`.mapWith(
          Number
        ),
      })
      .from(expenseSplits)
      .innerJoin(expenses, eq(expenses.id, expenseSplits.expenseId))
      .where(and(monthFilter, eq(expenseSplits.userId, userId)))
      .get(),
    db
      .select({
        category: expenses.category,
        total: sql<number>`coalesce(sum(${expenses.amount}), 0)`.mapWith(Number),
      })
      .from(expenses)
      .where(monthFilter)
      .groupBy(expenses.category)
      .all(),
  ]);

  const groupTotal = totalRow?.total ?? 0;
  const yourShare = shareRow?.total ?? 0;
  const categories = categoryRows
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  const myNets = balances
    .map((s) => ({
      currency: s.currency,
      net: s.netByUser[userId] ?? 0,
    }))
    .filter((n) => Math.abs(n.net) > 0.009);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly summary"
        description={`${group.name} · ${monthLabel(year, month)}`}
        actions={
          <>
            <Link href={`/groups/${id}`}>
              <Button variant="outline">Back to group</Button>
            </Link>
            <div className="flex gap-2">
              <Link href={`/groups/${id}/summary?month=${prev.key}`}>
                <Button variant="ghost" size="sm">
                  ← {monthLabel(prev.year, prev.month)}
                </Button>
              </Link>
              <Link href={`/groups/${id}/summary?month=${next.key}`}>
                <Button variant="ghost" size="sm">
                  {monthLabel(next.year, next.month)} →
                </Button>
              </Link>
            </div>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">Group spend</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {formatMoney(groupTotal, group.currency)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Your share</p>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {formatMoney(yourShare, group.currency)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Sum of your splits this month
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-muted">
          Spend by category
        </h2>
        {categories.length === 0 ? (
          <p className="text-sm text-muted">No expenses this month.</p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((c) => (
              <li
                key={c.category}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="font-medium text-ink">{c.category}</span>
                <span className="tabular-nums text-muted">
                  {formatMoney(c.total, group.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-muted">
          Current net balances
        </h2>
        <p className="mb-3 text-xs text-muted">
          All-time balances for this group (not limited to the selected month).
        </p>
        {myNets.length > 0 && (
          <p className="mb-4 text-sm text-ink">
            Your net:{" "}
            {myNets.map((n, i) => (
              <span key={n.currency}>
                {i > 0 ? " · " : ""}
                <span className={n.net >= 0 ? "text-accent" : "text-danger"}>
                  {n.net >= 0 ? "you're owed " : "you owe "}
                  {formatMoney(Math.abs(n.net), n.currency)}
                </span>
              </span>
            ))}
          </p>
        )}
        <BalanceList
          summaries={balances}
          nameById={nameById}
          currentUserId={userId}
          memberIds={members.map((m) => m.userId)}
          groupId={id}
        />
      </Card>
    </div>
  );
}
