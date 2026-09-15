type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function resolveApiKey(): string | null {
  const raw = process.env.RESEND_API_KEY?.trim();
  if (!raw || raw === "undefined" || raw === "null") return null;
  return raw;
}

/** Sends via Resend when configured. Never throws — missing/invalid key is a no-op. */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[email] skipped (no RESEND_API_KEY):",
        input.to,
        input.subject
      );
    }
    return false;
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
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed", err);
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return resolveApiKey() !== null;
}
