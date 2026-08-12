import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Playbook } from "../api/types";
import { useAuth } from "../state/AuthContext";

const ACTION_LABEL: Record<string, string> = {
  send_email: "Send email",
  escalate: "Escalate",
  create_task: "Create task",
  phone_call: "Phone call",
};

export function Playbooks() {
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState<Playbook[] | null>(null);
  const [stepForm, setStepForm] = useState<Record<string, { triggerDays: string; action: string; template: string }>>({});
  const canEdit = user?.role === "controller" || user?.role === "cfo" || user?.role === "admin";

  const load = () => api.get<Playbook[]>("/playbooks").then(setPlaybooks);

  useEffect(() => {
    load();
  }, []);

  async function addStep(playbookId: string) {
    const form = stepForm[playbookId];
    if (!form?.triggerDays || !form.template) return;
    await api.post(`/playbooks/${playbookId}/steps`, {
      triggerDays: Number(form.triggerDays),
      action: form.action || "send_email",
      template: form.template,
    });
    setStepForm({ ...stepForm, [playbookId]: { triggerDays: "", action: "send_email", template: "" } });
    await load();
  }

  if (!playbooks) return <div className="empty-state">Loading playbooks…</div>;

  return (
    <div>
      <div className="page-head">
        <p className="page-eyebrow">Playbooks</p>
        <h1>Segment cadences</h1>
        <p>Design and configure how Flux escalates each customer segment — authored here, not buried in code.</p>
      </div>

      {playbooks.map((pb) => (
        <div key={pb.id} className="card" style={{ marginBottom: 20 }}>
          <h4 style={{ marginTop: 0, fontSize: "1.05rem" }}>{pb.name}</h4>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.86rem", marginBottom: 16 }}>
            {pb.description} · segment: <span className="mono">{pb.segment}</span>
          </p>

          {pb.steps.map((step) => (
            <div key={step.id} style={{ display: "flex", gap: 14, padding: "10px 0", borderTop: "1px solid var(--line)" }}>
              <div className="mono" style={{ fontSize: "0.78rem", color: "var(--accent)", width: 60, flexShrink: 0 }}>
                Step {step.order}
              </div>
              <div style={{ fontSize: "0.86rem" }}>
                When an invoice is <strong>{step.triggerDays} days</strong> overdue → <strong>{ACTION_LABEL[step.action]}</strong>: {step.template}
              </div>
            </div>
          ))}

          {canEdit && (
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <input
                placeholder="Days overdue"
                type="number"
                style={{ width: 110, padding: 8, border: "1px solid var(--line)", borderRadius: 6 }}
                value={stepForm[pb.id]?.triggerDays ?? ""}
                onChange={(e) => setStepForm({ ...stepForm, [pb.id]: { triggerDays: e.target.value, action: stepForm[pb.id]?.action ?? "send_email", template: stepForm[pb.id]?.template ?? "" } })}
              />
              <select
                style={{ padding: 8, border: "1px solid var(--line)", borderRadius: 6 }}
                value={stepForm[pb.id]?.action ?? "send_email"}
                onChange={(e) => setStepForm({ ...stepForm, [pb.id]: { triggerDays: stepForm[pb.id]?.triggerDays ?? "", action: e.target.value, template: stepForm[pb.id]?.template ?? "" } })}
              >
                {Object.entries(ACTION_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                placeholder="Template / note"
                style={{ flex: 1, minWidth: 180, padding: 8, border: "1px solid var(--line)", borderRadius: 6 }}
                value={stepForm[pb.id]?.template ?? ""}
                onChange={(e) => setStepForm({ ...stepForm, [pb.id]: { triggerDays: stepForm[pb.id]?.triggerDays ?? "", action: stepForm[pb.id]?.action ?? "send_email", template: e.target.value } })}
              />
              <button className="btn primary" onClick={() => addStep(pb.id)}>
                Add step
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
