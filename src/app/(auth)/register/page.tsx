"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerAction, type ActionResult } from "@/actions/auth";
import { AvatarPicker } from "@/components/avatar-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

const initial: ActionResult = {};

export default function RegisterPage() {
  const [avatarId, setAvatarId] = useState(1);
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-bg px-4 py-10"
      style={{
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <Card className="w-full max-w-md">
        <p className="text-xl font-extrabold tracking-tight text-ink">
          Evenly
          <span className="mt-1.5 block h-0.5 w-10 bg-primary" aria-hidden />
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Create account</h1>
        <p className="mt-1 text-sm text-muted">
          Start splitting with your people — private to your groups.
        </p>
        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="avatarId" value={avatarId} />
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              minLength={10}
              maxLength={72}
              autoComplete="new-password"
              required
            />
            <p className="mt-1.5 text-xs text-muted">
              Use at least 10 characters.
            </p>
          </div>
          <AvatarPicker value={avatarId} onChange={setAvatarId} />
          {state.error && <FormMessage error={state.error} />}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-muted">
          Already have an account?{" "}
          <Link className="font-semibold text-primary" href="/login">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
