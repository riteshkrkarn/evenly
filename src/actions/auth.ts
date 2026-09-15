"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { migrate } from "@/db/ensure-migrated";
import { passwordResetTokens, users } from "@/db/schema";
import { createId } from "@/lib/id";
import { clientKey } from "@/lib/request-key";
import { checkRateLimit, safeNextPath, validatePassword } from "@/lib/security";

export type ActionResult = { error?: string; success?: string };

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(72),
  avatarId: z.coerce.number().int().min(1).max(5).default(1),
});

function credentialsFailed(error: unknown) {
  if (error instanceof AuthError) return true;
  const type = (error as { type?: string } | null)?.type;
  return type === "CredentialsSignin" || type === "CallbackRouteError";
}

function tooManyTries(retryAfterSec: number) {
  if (retryAfterSec >= 60) {
    const minutes = Math.ceil(retryAfterSec / 60);
    return `Too many attempts. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"}, then try again.`;
  }
  return `Too many attempts. Please wait ${retryAfterSec} seconds, then try again.`;
}

function registerValidationError(
  issues: z.ZodIssue[]
): string {
  const paths = new Set(issues.map((i) => i.path[0]));
  if (paths.has("email")) {
    return "Please enter a valid email address.";
  }
  if (paths.has("password")) {
    const passwordIssue = issues.find((i) => i.path[0] === "password");
    if (passwordIssue?.code === "too_small") {
      return "Password must be at least 10 characters.";
    }
    if (passwordIssue?.code === "too_big") {
      return "Password must be at most 72 characters.";
    }
    return "Please choose a password between 10 and 72 characters.";
  }
  if (paths.has("name")) {
    return "Please enter your name.";
  }
  return "Please check your details and try again.";
}

async function signInWithPassword(email: string, password: string) {
  if (!process.env.AUTH_SECRET) {
    return {
      error:
        "Sign-in isn’t available right now. Please try again in a few minutes.",
    };
  }
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result && typeof result === "object" && "error" in result && result.error) {
      return {
        error:
          "That email or password doesn’t match. Check both, or reset your password.",
      };
    }
  } catch (error) {
    if (credentialsFailed(error)) {
      return {
        error:
          "That email or password doesn’t match. Check both, or reset your password.",
      };
    }
    return {
      error:
        "We couldn’t sign you in just now. Please try again in a moment.",
    };
  }
  return null;
}

export async function registerAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await migrate();
  const rate = await checkRateLimit(await clientKey("register"), 10);
  if (!rate.ok) {
    return { error: tooManyTries(rate.retryAfterSec) };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").toLowerCase(),
    password: formData.get("password"),
    avatarId: formData.get("avatarId") ?? 1,
  });
  if (!parsed.success) {
    return { error: registerValidationError(parsed.error.issues) };
  }

  const { name, email, password, avatarId } = parsed.data;
  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    return {
      error:
        "An account with this email already exists. Try logging in instead.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    id: createId("usr"),
    email,
    name,
    passwordHash,
    avatarId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const signInError = await signInWithPassword(email, password);
  if (signInError) {
    return {
      error:
        "Your account was created, but we couldn’t sign you in automatically. Please log in.",
    };
  }
  redirect("/dashboard");
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const rate = await checkRateLimit(await clientKey("login"), 20);
  if (!rate.ok) {
    return { error: tooManyTries(rate.retryAfterSec) };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email) {
    return { error: "Enter the email for your account." };
  }
  if (!z.string().email().safeParse(email).success) {
    return { error: "Please enter a valid email address." };
  }
  if (!password) {
    return { error: "Enter your password." };
  }

  const signInError = await signInWithPassword(email, password);
  if (signInError) return signInError;
  redirect(safeNextPath(formData.get("next")));
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function requestPasswordResetAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await migrate();
  const rate = await checkRateLimit(await clientKey("reset"), 5);
  if (!rate.ok) {
    return { error: tooManyTries(rate.retryAfterSec) };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { error: "Enter the email for your account." };
  }
  if (!z.string().email().safeParse(email).success) {
    return { error: "Please enter a valid email address." };
  }

  const generic =
    "If an account exists for that email, we’ve sent a reset link. Check your inbox and spam folder.";
  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    return { success: generic };
  }

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, user.id));

  const token = createId("rst");
  await db.insert(passwordResetTokens).values({
    id: createId("prt"),
    token,
    userId: user.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    createdAt: new Date(),
  });

  const link = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
  if (process.env.NODE_ENV !== "production") {
    console.log("[password-reset]", link);
  }

  try {
    const { sendEmail } = await import("@/lib/email");
    await sendEmail({
      to: email,
      subject: "Reset your password",
      text: `Reset your password: ${link}`,
    });
  } catch {
    return {
      error:
        "We couldn’t send the reset email just now. Please try again in a moment.",
    };
  }

  return { success: generic };
}

export async function resetPasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await migrate();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!token) {
    return {
      error: "This reset link is missing or incomplete. Request a new one.",
    };
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return { error: passwordError };
  }

  const row = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .get();
  if (!row || row.expiresAt.getTime() < Date.now()) {
    return {
      error:
        "This reset link is invalid or has expired. Request a new one and try again.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, row.userId));
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, row.userId));

  return {
    success: "Password updated. You can log in with your new password.",
  };
}

export { safeNextPath };
