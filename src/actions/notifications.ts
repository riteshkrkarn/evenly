"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { sendPaymentRemindersAction } from "@/actions/advanced";

function revalidateNotifications() {
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

export async function markNotificationReadAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(eq(notifications.id, id), eq(notifications.userId, session.user.id))
    );
  revalidateNotifications();
}

/** Mark every notification as read (keeps history, clears unread badge). */
export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user?.id) return;
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, session.user.id));
  revalidateNotifications();
}

/** Permanently remove all notifications for the current user. */
export async function clearAllNotificationsAction() {
  const session = await auth();
  if (!session?.user?.id) return;
  await db
    .delete(notifications)
    .where(eq(notifications.userId, session.user.id));
  revalidateNotifications();
}

export { sendPaymentRemindersAction };
