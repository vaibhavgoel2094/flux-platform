import { useEffect, useState } from "react";
import { getStoredApiKey, setStoredApiKey, verifyApiKey } from "../anthropicBrowser";
import { resetDataset } from "../api/localApi";
import { getWorkspace } from "../localdb/store";

type KeyStatus = "unknown" | "checking" | "connected" | "error";

const INTEGRATIONS = [
  { name: "ERP — NetSuite / QuickBooks / Sage", detail: "Live invoice and customer sync, replacing the bundled dataset." },
  { name: "Email send — Postmark / SES", detail: "One-click send from Flux directly, in addition to the mailto handoff." },
  { name: "SSO — WorkOS / Auth0", detail: "Organization-managed sign-in, replacing the demo persona picker." },
];

export function Setup() {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<KeyStatus>("unknown");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState(() => {
    const ws = getWorkspace();
    return { orgName: ws.org.name, customers: ws.customers.length, invoices: ws.invoices.length, cases: ws.cases.length };
  });
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredApiKey();
    if (stored) {
      setApiKey(stored);
      setStatus("connected");
    }
  }, []);

  async function connect() {
    setStatus("checking");
    setError(null);
    const result = await verifyApiKey(apiKey.trim());
    if (result.ok) {
      setStoredApiKey(apiKey.trim());
      setStatus("connected");
    } else {
      setStatus("error");
      setError(result.error ?? "Could not verify this key.");
    }
  }

  function disconnect() {
    setStoredApiKey("");
    setApiKey("");
    setStatus("unknown");
  }

  function reload() {
    resetDataset();
    const ws = getWorkspace();
    setInfo({ orgName: ws.org.name, customers: ws.customers.length, invoices: ws.invoices.length, cases: ws.cases.length });
    setResetMessage("Workspace reset to the bundled synthetic dataset.");
    setTimeout(() => setResetMessage(null), 4000);
  }

  return (
    <div>
      <div className="page-head">
        <p className="page-eyebrow">Setup</p>
        <h1>Connect Flux</h1>
        <p>Everything here runs from the browser — no server, no terminal. Connect a live AI provider when you're ready; the product works fully without one.</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h4 style={{ marginTop: 0 }}>Anthropic API key</h4>
        <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 0 }}>
          Enables live AI analysis and Ask Flux. Stored only in this browser tab's session storage — never written to the dataset,
          never exported, discarded when the tab closes. Without a key, every case still runs a full saved-evidence analysis
          against the same governance rules.
        </p>
        <div className="btn-row" style={{ marginBottom: 10 }}>
          <input
            type="password"
            placeholder="sk-ant-…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ flex: 1, minWidth: 240, padding: 10, border: "1px solid var(--line)", borderRadius: 6, fontFamily: "var(--data)", fontSize: "0.85rem" }}
          />
          <button className="btn primary" disabled={!apiKey || status === "checking"} onClick={connect}>
            {status === "checking" ? "Verifying…" : "Connect"}
          </button>
          {status === "connected" && (
            <button className="btn" onClick={disconnect}>
              Disconnect
            </button>
          )}
        </div>
        {status === "connected" && <span className="chip good">Connected — live analysis and Ask Flux enabled</span>}
        {status === "error" && <span className="chip bad">{error}</span>}
        {status === "unknown" && <span className="chip neutral">Not connected — running in saved-evidence mode</span>}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h4 style={{ marginTop: 0 }}>Synthetic dataset</h4>
        <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 0 }}>
          Bundled with this build and committed to the repository — nothing to upload. {info.orgName}: {info.customers} customers,{" "}
          {info.invoices} invoices, {info.cases} cases.
        </p>
        <div className="btn-row">
          <button className="btn" onClick={reload}>
            Reset workspace to bundled dataset
          </button>
        </div>
        {resetMessage && <p style={{ fontSize: "0.82rem", color: "var(--good)", marginTop: 8, marginBottom: 0 }}>{resetMessage}</p>}
        <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 10, marginBottom: 0 }}>
          Every review, analysis, and setting you change is saved to this browser only. Resetting clears it back to the original
          dataset — archived activity is not preserved.
        </p>
      </div>

      <div className="card">
        <h4 style={{ marginTop: 0 }}>Integrations</h4>
        <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 0 }}>
          Phase 1 ships governance, workflow, and the full agent product surface. Live system connections are next.
        </p>
        {INTEGRATIONS.map((i) => (
          <div key={i.name} className="control-row">
            <div>
              <h4>{i.name}</h4>
              <p>{i.detail}</p>
            </div>
            <span className="chip warn">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
