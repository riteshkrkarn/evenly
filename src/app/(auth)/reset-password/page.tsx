"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import {
  requestPasswordResetAction,
  resetPasswordAction,
  type ActionResult,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Suspense } from "react";

const initial: ActionResult = {};

function ResetInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [reqState, reqAction, reqPending] = useActionState(
    requestPasswordResetAction,
    initial
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetPasswordAction,
    initial
  );

  if (token) {
    return (
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-ink">Set new password</h1>
        <p className="mt-1 text-sm text-muted">
          Choose a new password with at least 10 characters.
        </p>
        <form action={resetAction} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
              name="password"
              minLength={10}
              maxLength={72}
              autoComplete="new-password"
              required
            />
          </div>
          <FormMessage error={resetState.error} success={resetState.success} />
          {resetState.success ? (
            <Link href="/login">
              <Button type="button" className="w-full">
                Go to log in
              </Button>
            </Link>
          ) : (
            <Button type="submit" className="w-full" disabled={resetPending}>
              {resetPending ? "Updating…" : "Update password"}
            </Button>
          )}
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-ink">Reset password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your email and we’ll send a reset link if an account exists.
      </p>
      <form action={reqAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <FormMessage error={reqState.error} success={reqState.success} />
        <Button type="submit" className="w-full" disabled={reqPending}>
          {reqPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-5 text-sm text-muted">
        Remembered it?{" "}
        <Link className="font-semibold text-primary" href="/login">
          Log in
        </Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-bg px-4 py-8"
      style={{
        paddingTop: "max(2rem, env(safe-area-inset-top))",
        paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
      }}
    >
      <Suspense>
        <ResetInner />
      </Suspense>
    </div>
  );
}
