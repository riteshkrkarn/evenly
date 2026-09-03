import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { migrate } from "@/db/ensure-migrated";
import { users } from "@/db/schema";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await migrate();

  const row = await db
    .select({
      name: users.name,
      email: users.email,
      avatarId: users.avatarId,
      emailRemindersEnabled: users.emailRemindersEnabled,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .get();

  if (!row) redirect("/login");

  return (
    <ProfileClient
      name={row.name}
      email={row.email}
      avatarId={row.avatarId}
      emailRemindersEnabled={Boolean(row.emailRemindersEnabled)}
    />
  );
}
