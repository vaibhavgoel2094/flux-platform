// Direct browser-to-Anthropic calls for the zero-backend build — the same
// bring-your-own-key pattern the reference capstone uses for its public
// GitHub Pages demo. The key lives in sessionStorage only: never written to
// the bundled dataset, never exported with activity, discarded when the
// browser tab closes.

const SESSION_KEY = "flux.anthropicApiKey";

export function getStoredApiKey(): string {
  return sessionStorage.getItem(SESSION_KEY) ?? "";
}

export function setStoredApiKey(key: string) {
  if (key) sessionStorage.setItem(SESSION_KEY, key);
  else sessionStorage.removeItem(SESSION_KEY);
}

export function hasApiKey(): boolean {
  return Boolean(getStoredApiKey());
}

export async function verifyApiKey(key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body?.error?.message ?? `Anthropic rejected the key (${res.status}).` };
  } catch {
    return { ok: false, error: "Could not reach Anthropic from the browser. Check the key and your connection." };
  }
}

export async function runAgentBrowser(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = getStoredApiKey();
  if (!key) throw new Error("NO_API_KEY");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `The AI provider request failed (${res.status}).`);
  }
  const data = await res.json();
  const block = (data.content as { type: string; text?: string }[]).find((b) => b.type === "text");
  return block?.text ?? "";
}
