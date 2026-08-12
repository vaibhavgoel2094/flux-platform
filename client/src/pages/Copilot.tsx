import { useState } from "react";
import { api, ApiError } from "../api/client";

const SUGGESTED = [
  "Give me a summary of what's currently overdue and why.",
  "Flag risky accounts that are trending late.",
  "Which agent type has the most open cases right now?",
  "Draft a follow-up email for our most overdue strategic account.",
];

interface Turn {
  question: string;
  answer?: string;
  error?: string;
}

export function Copilot() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true);
    setInput("");
    setTurns((prev) => [...prev, { question }]);
    try {
      const { answer } = await api.post<{ answer: string }>("/copilot/ask", { question });
      setTurns((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, answer } : t)));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong.";
      setTurns((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, error: message } : t)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <p className="page-eyebrow">Copilot</p>
        <h1>Ask Flux</h1>
        <p>Natural-language Q&amp;A over your live portfolio — answers are grounded in real records, not invented.</p>
      </div>

      {turns.length === 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SUGGESTED.map((s) => (
              <button key={s} className="btn" style={{ textAlign: "left" }} onClick={() => ask(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {turns.map((t, i) => (
        <div key={i} className="card" style={{ marginBottom: 14 }}>
          <p style={{ fontWeight: 600, marginTop: 0, marginBottom: 10 }}>{t.question}</p>
          {t.answer && <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.9rem" }}>{t.answer}</p>}
          {t.error && (
            <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--bad)" }}>{t.error}</p>
          )}
          {!t.answer && !t.error && <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.86rem" }}>Thinking…</p>}
        </div>
      ))}

      <div className="btn-row">
        <input
          placeholder="Ask about overdue balances, risk, trends…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(input)}
          style={{ flex: 1, padding: 10, border: "1px solid var(--line)", borderRadius: 6, fontSize: "0.9rem" }}
        />
        <button className="btn primary" disabled={busy} onClick={() => ask(input)}>
          Ask
        </button>
      </div>
    </div>
  );
}
