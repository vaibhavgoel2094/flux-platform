import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AgentPersona, AutomationRule } from "../api/types";
import { useAuth } from "../state/AuthContext";

export function AgentStudio() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"Roles" | "Automations">("Roles");
  const [personas, setPersonas] = useState<AgentPersona[] | null>(null);
  const [rules, setRules] = useState<AutomationRule[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const canEdit = user?.role === "controller" || user?.role === "cfo" || user?.role === "admin";

  useEffect(() => {
    api.get<AgentPersona[]>("/agent-studio/personas").then(setPersonas);
    api.get<AutomationRule[]>("/agent-studio/automations").then(setRules);
  }, []);

  async function savePersona(agentType: string) {
    const updated = await api.put<AgentPersona>(`/agent-studio/personas/${agentType}`, { instructions: draft });
    setPersonas((prev) => prev?.map((p) => (p.agentType === agentType ? updated : p)) ?? null);
    setEditing(null);
  }

  async function toggleRule(rule: AutomationRule) {
    const updated = await api.put<AutomationRule>(`/agent-studio/automations/${rule.id}`, { live: !rule.live });
    setRules((prev) => prev?.map((r) => (r.id === rule.id ? updated : r)) ?? null);
  }

  return (
    <div>
      <div className="page-head">
        <p className="page-eyebrow">Agent Studio</p>
        <h1>Governance console</h1>
        <p>Every agent's persona and automation reach, editable here — not a code deploy.</p>
      </div>

      <div className="tabs">
        <div className={`tab${tab === "Roles" ? " active" : ""}`} onClick={() => setTab("Roles")}>
          Roles
        </div>
        <div className={`tab${tab === "Automations" ? " active" : ""}`} onClick={() => setTab("Automations")}>
          Automations
        </div>
      </div>

      {tab === "Roles" &&
        personas?.map((p) => (
          <div key={p.id} className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h4 style={{ marginTop: 0 }}>{p.label}</h4>
              {canEdit && editing !== p.agentType && (
                <button className="btn" onClick={() => { setEditing(p.agentType); setDraft(p.instructions); }}>
                  Edit rule
                </button>
              )}
            </div>
            {editing === p.agentType ? (
              <div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={5}
                  style={{ width: "100%", fontFamily: "inherit", fontSize: "0.86rem", padding: 10, border: "1px solid var(--line)", borderRadius: 6 }}
                />
                <div className="btn-row" style={{ marginTop: 10 }}>
                  <button className="btn primary" onClick={() => savePersona(p.agentType)}>
                    Save changes
                  </button>
                  <button className="btn" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--ink-soft)" }}>{p.instructions}</p>
            )}
          </div>
        ))}

      {tab === "Automations" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Agent</th>
                <th className="num">Involvement</th>
                <th>Is agent live</th>
              </tr>
            </thead>
            <tbody>
              {rules?.map((r) => (
                <tr key={r.id} style={{ cursor: "default" }}>
                  <td>{r.label}</td>
                  <td className="mono">{r.agentType}</td>
                  <td className="num">{r.involvementPct}%</td>
                  <td>
                    <button className={`btn${r.live ? " primary" : ""}`} disabled={!canEdit} onClick={() => toggleRule(r)}>
                      {r.live ? "Live" : "Off"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
