import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { CaseDetail as CaseDetailType } from "../api/types";
import { StatusChip } from "../components/StatusChip";

export function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<CaseDetailType | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = () => api.get<CaseDetailType>(`/cases/${id}`).then(setItem);

  useEffect(() => {
    load();
  }, [id]);

  async function analyze(mode: "live" | "saved") {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/cases/${id}/analyze`, { mode });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Analysis failed.");
    } finally {
      setBusy(false);
    }
  }

  async function review(decision: "approve" | "edit" | "escalate" | "correction") {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/cases/${id}/review`, { decision, note: note || undefined });
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not record review.");
    } finally {
      setBusy(false);
    }
  }

  if (!item) return <div className="empty-state">Loading case…</div>;

  const latest = item.actions[0];

  return (
    <div>
      <div className="page-head">
        <p className="page-eyebrow">
          <Link to="/">Control Tower</Link> / Case
        </p>
        <h1>{item.title}</h1>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <StatusChip value={item.state} />
          <StatusChip value={item.autonomy} />
          <StatusChip value={item.status} />
        </div>
      </div>

      {error && <div className="banner locked">{error}</div>}

      <div className="case-detail">
        <div className="card">
          <h4 style={{ marginTop: 0 }}>Recommendation</h4>
          {!latest && (
            <div className="btn-row">
              <button className="btn primary" disabled={busy} onClick={() => analyze("live")}>
                Run live analysis
              </button>
              <button className="btn" disabled={busy} onClick={() => analyze("saved")}>
                Run saved-evidence analysis
              </button>
            </div>
          )}
          {latest && (
            <>
              <span className={`provenance ${latest.source === "live-ai" ? "live" : "saved"}`}>
                {latest.source === "live-ai" ? "● Live AI decision" : "○ Saved evidence — not a live decision"}
              </span>
              <p style={{ marginTop: 10, marginBottom: 4, fontWeight: 600 }}>{latest.recommendation}</p>
              <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem" }}>{latest.rationale}</p>
              <h4>Draft customer communication</h4>
              <textarea className="draft-box" defaultValue={latest.customerDraft} rows={7} />
              <div className="btn-row" style={{ marginTop: 14 }}>
                <button className="btn primary" disabled={busy} onClick={() => review("approve")}>
                  Approve
                </button>
                <button className="btn" disabled={busy} onClick={() => review("edit")}>
                  Approve with edits
                </button>
                <button className="btn" disabled={busy} onClick={() => review("escalate")}>
                  Escalate
                </button>
                <button className="btn danger" disabled={busy} onClick={() => review("correction")}>
                  Flag correction
                </button>
              </div>
              <textarea
                placeholder="Optional note for this decision…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                style={{ width: "100%", marginTop: 10, fontFamily: "inherit", fontSize: "0.85rem", padding: 8, border: "1px solid var(--line)", borderRadius: 6 }}
              />
              <div className="btn-row" style={{ marginTop: 12 }}>
                <button className="btn" disabled={busy} onClick={() => analyze("live")}>
                  Re-run live analysis
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <h4 style={{ marginTop: 0 }}>Customer</h4>
            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{item.customer.name}</p>
            <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.85rem" }}>
              {item.customer.tier} · {item.customer.strategicStatus}
            </p>
            <Link to={`/customers/${item.customer.id}`} style={{ fontSize: "0.82rem", color: "var(--accent)", display: "inline-block", marginTop: 8 }}>
              View Customer 360 →
            </Link>
          </div>

          {item.invoice && (
            <div className="card">
              <h4 style={{ marginTop: 0 }}>Invoice</h4>
              <p style={{ margin: "0 0 4px" }}>
                {item.invoice.invoiceNo} — {item.invoice.currency} {item.invoice.amount.toLocaleString()}
              </p>
              <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.85rem" }}>
                {item.invoice.daysOverdue} days overdue · {item.invoice.status}
              </p>
            </div>
          )}

          {latest && (
            <div className="card">
              <h4 style={{ marginTop: 0 }}>Evidence &amp; citations</h4>
              {latest.evidence.map((e, i) => (
                <div key={i} className="evidence-item">
                  {e}
                </div>
              ))}
              <p style={{ fontSize: "0.78rem", color: "var(--ink-soft)", marginTop: 10, marginBottom: 0 }}>
                Autonomy: proposed {latest.proposedAutonomy}, ceiling {latest.expectedAutonomy} ({latest.policyAlignment})
              </p>
            </div>
          )}

          {item.reviews.length > 0 && (
            <div className="card">
              <h4 style={{ marginTop: 0 }}>Review history</h4>
              {item.reviews.map((r) => (
                <div key={r.id} style={{ fontSize: "0.83rem", marginBottom: 8 }}>
                  <strong>{r.user.name}</strong> {r.decision}d — {new Date(r.createdAt).toLocaleString()}
                  {r.note && <div style={{ color: "var(--ink-soft)" }}>{r.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
