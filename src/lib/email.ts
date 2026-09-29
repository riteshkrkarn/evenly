type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult = {
  ok: boolean;
  error?: string;
};

function resolveApiKey(): string | null {
  const raw = process.env.RESEND_API_KEY?.trim();
  if (!raw || raw === "undefined" || raw === "null") return null;
  return raw;
}

function humanizeResendError(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (
    status === 403 &&
    (lower.includes("only send testing emails") ||
      lower.includes("verify a domain"))
  ) {
    return "Resend’s test sender (resend.dev) can only email your Resend account address. Verify a domain in Resend and set EMAIL_FROM to an address on that domain.";
  }
  if (status === 401 || lower.includes("api key")) {
    return "Resend rejected the API key. Check RESEND_API_KEY in the deployment environment.";
  }
  if (status === 422 || lower.includes("from")) {
    return "Resend rejected the sender address. Check EMAIL_FROM uses a verified domain.";
  }
  return "We couldn’t send the reset email just now. Please try again in a moment.";
}

/** Sends via Resend when configured. Never throws — missing/invalid key is a no-op. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[email] skipped (no RESEND_API_KEY):",
        input.to,
        input.subject
      );
    }
    return {
      ok: false,
      error:
        "Password reset email isn’t configured yet. Add RESEND_API_KEY to your environment.",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || "Evenly <onboarding@resend.dev>",
        to: input.to,
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] resend failed", res.status, body);
      return { ok: false, error: humanizeResendError(res.status, body) };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed", err);
    return {
      ok: false,
      error:
        "We couldn’t send the reset email just now. Please try again in a moment.",
    };
  }
}

export function isEmailConfigured(): boolean {
  return resolveApiKey() !== null;
}

/** Public app origin for links in emails (reset, reminders). */
export function appOrigin(): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}
