import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Bootstrap, CaseSummary } from "../api/types";
import { StatusChip } from "../components/StatusChip";
import { useAuth } from "../state/AuthContext";

const AGENT_LABEL: Record<string, string> = {
  collections: "Collections",
  billing: "Billing",
  deductions: "Deductions",
  cash_application: "Cash application",
  supplier_payer: "Supplier & payer",
};

export function ControlTower() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    api.get<Bootstrap>("/bootstrap").then(setBoot);
    api.get<CaseSummary[]>("/cases").then(setCases);
  }, []);

  const money = (n: number, currency = "GBP") => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(n);

  const agentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of cases ?? []) counts[c.agentType] = (counts[c.agentType] ?? 0) + 1;
    return counts;
  }, [cases]);

  const filtered = useMemo(() => (agentFilter === "all" ? cases ?? [] : (cases ?? []).filter((c) => c.agentType === agentFilter)), [cases, agentFilter]);

  return (
    <div>
      <div className="page-head">
        <p className="page-eyebrow">Control Tower</p>
        <h1>Hello, {user?.name.split(" ")[0]}</h1>
        <p>Every open case across your agents, prioritized by risk and age.</p>
      </div>

      {boot && !boot.released && (
        <div className="banner locked">
          The Collections agent has not been released yet. A Controller must run and accept all six release controls on{" "}
          <Link to="/assurance" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
            Assurance
          </Link>{" "}
          before this queue reflects live decisions.
        </div>
      )}

      {boot && (
        <div className="grid-3">
          <div className="card stat-card">
            <h4>Open cases</h4>
            <div className="big">{cases?.length ?? "—"}</div>
          </div>
          <div className="card stat-card">
            <h4>Not analyzed</h4>
            <div className="big">{boot.caseSummary["Not analyzed"] ?? 0}</div>
          </div>
          <div className="card stat-card">
            <h4>Release status</h4>
            <div style={{ marginTop: 4 }}>
              <StatusChip value={boot.released ? "Ready" : "Blocked"} />
            </div>
          </div>
        </div>
      )}

      <div className="btn-row" style={{ marginBottom: 14 }}>
        <button className={`btn${agentFilter === "all" ? " primary" : ""}`} onClick={() => setAgentFilter("all")}>
          All agents ({cases?.length ?? 0})
        </button>
        {Object.entries(AGENT_LABEL).map(([type, label]) => (
          <button key={type} className={`btn${agentFilter === type ? " primary" : ""}`} onClick={() => setAgentFilter(type)}>
            {label} ({agentCounts[type] ?? 0})
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Case</th>
              <th>Agent</th>
              <th>Customer</th>
              <th className="num">Amount</th>
              <th className="num">Days overdue</th>
              <th>State</th>
              <th>Autonomy</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, visibleCount).map((c) => (
              <tr key={c.id} onClick={() => navigate(`/cases/${c.id}`)}>
                <td>{c.title}</td>
                <td className="mono" style={{ fontSize: "0.76rem" }}>
                  {AGENT_LABEL[c.agentType] ?? c.agentType}
                </td>
                <td>{c.customer.name}</td>
                <td className="num">{c.invoice ? money(c.invoice.amount) : "—"}</td>
                <td className="num">{c.invoice?.daysOverdue ?? "—"}</td>
                <td>
                  <StatusChip value={c.state} />
                </td>
                <td>
                  <StatusChip value={c.autonomy} />
                </td>
                <td>
                  <StatusChip value={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state">No open cases for this agent.</div>}
      </div>
      {filtered.length > visibleCount && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button className="btn" onClick={() => setVisibleCount((n) => n + 50)}>
            Show more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
