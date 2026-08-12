import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { EvaluationControl } from "../api/types";
import { StatusChip } from "../components/StatusChip";
import { useAuth } from "../state/AuthContext";

export function Assurance() {
  const { user } = useAuth();
  const [data, setData] = useState<{ controls: EvaluationControl[]; released: boolean } | null>(null);
  const canAct = user?.role === "controller" || user?.role === "cfo" || user?.role === "admin";

  const load = () => api.get<{ controls: EvaluationControl[]; released: boolean }>("/evaluations").then(setData);

  useEffect(() => {
    load();
  }, []);

  async function run(controlId: string) {
    await api.post(`/evaluations/${controlId}/run`);
    await load();
  }
  async function rate(controlId: string, rating: "pass" | "fail") {
    await api.put(`/evaluations/${controlId}`, { rating });
    await load();
  }

  if (!data) return <div className="empty-state">Loading assurance…</div>;

  return (
    <div>
      <div className="page-head">
        <p className="page-eyebrow">Assurance</p>
        <h1>Release gate</h1>
        <p>All six controls must run and pass before the Collections agent's queue reflects live decisions to the AR team.</p>
      </div>

      <div className="grid-3">
        <div className="card stat-card">
          <h4>Controls passed</h4>
          <div className="big">{data.controls.filter((c) => c.evaluation?.rating === "pass").length} / {data.controls.length}</div>
        </div>
        <div className="card stat-card">
          <h4>Release status</h4>
          <div style={{ marginTop: 4 }}>
            <StatusChip value={data.released ? "Ready" : "Blocked"} />
          </div>
        </div>
        <div className="card stat-card">
          <h4>Your role</h4>
          <div style={{ marginTop: 4 }}>
            <StatusChip value={canAct ? "normal" : "low"} />
            <span style={{ marginLeft: 8, fontSize: "0.82rem", color: "var(--ink-soft)" }}>{canAct ? "Can run and rate controls" : "View only"}</span>
          </div>
        </div>
      </div>

      <div className="card">
        {data.controls.map((c) => (
          <div key={c.id} className="control-row">
            <div>
              <h4>{c.label}</h4>
              <p>{c.description}</p>
              {c.evaluation?.runAt && (
                <p style={{ marginTop: 4, fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                  Last run {new Date(c.evaluation.runAt).toLocaleString()}
                  {c.evaluation.ratedBy ? ` · rated by ${c.evaluation.ratedBy.name}` : ""}
                </p>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {c.evaluation?.rating && <StatusChip value={c.evaluation.rating} />}
              {canAct && (
                <div className="btn-row">
                  <button className="btn" onClick={() => run(c.id)}>
                    Run
                  </button>
                  <button className="btn primary" disabled={!c.evaluation?.runAt} onClick={() => rate(c.id, "pass")}>
                    Pass
                  </button>
                  <button className="btn danger" disabled={!c.evaluation?.runAt} onClick={() => rate(c.id, "fail")}>
                    Fail
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
