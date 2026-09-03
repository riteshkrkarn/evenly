import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { migrate } from "@/db/ensure-migrated";
import { groupMembers, groups, users } from "@/db/schema";
import { getGroupBalances, getGroupMembers } from "@/lib/group-data";
import { sendEmail } from "@/lib/email";
import { formatMoney } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await migrate();

  const optedIn = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.emailRemindersEnabled, true))
    .all();

  let sent = 0;
  let skipped = 0;

  for (const user of optedIn) {
    const memberships = await db
      .select({
        groupId: groups.id,
        groupName: groups.name,
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groups.id, groupMembers.groupId))
      .where(and(eq(groupMembers.userId, user.id), isNull(groups.deletedAt)))
      .all();

    const lines: string[] = [];
    for (const m of memberships) {
      const [balances, members] = await Promise.all([
        getGroupBalances(m.groupId),
        getGroupMembers(m.groupId),
      ]);
      const nameById = Object.fromEntries(members.map((r) => [r.userId, r.name]));

      for (const summary of balances) {
        const debts = summary.pairwiseDebts ?? summary.debts;
        for (const debt of debts) {
          if (debt.fromUserId !== user.id) continue;
          lines.push(
            `• ${m.groupName}: you owe ${nameById[debt.toUserId] ?? "someone"} ${formatMoney(debt.amount, debt.currency)}`
          );
        }
      }
    }

    if (lines.length === 0) {
      skipped += 1;
      continue;
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const text = [
      `Hi ${user.name},`,
      "",
      "Here's your monthly amount-due reminder:",
      "",
      ...lines,
      "",
      `Open Splitwise: ${appUrl}/dashboard`,
      "",
      "You can turn these emails off in Profile settings.",
    ].join("\n");

    const ok = await sendEmail({
      to: user.email,
      subject: "Your monthly amount due",
      text,
    });
    if (ok) sent += 1;
    else skipped += 1;
  }

  return NextResponse.json({
    users: optedIn.length,
    sent,
    skipped,
  });
}
