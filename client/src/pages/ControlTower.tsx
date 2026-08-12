import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Bootstrap, CaseSummary } from "../api/types";
import { StatusChip } from "../components/StatusChip";
import { useAuth } from "../state/AuthContext";

export function ControlTower() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boot, setBoot] = useState<Bootstrap | null>(null);
  const [cases, setCases] = useState<CaseSummary[] | null>(null);

  useEffect(() => {
    api.get<Bootstrap>("/bootstrap").then(setBoot);
    api.get<CaseSummary[]>("/cases").then(setCases);
  }, []);

  const money = (n: number, currency = "GBP") => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(n);

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

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Case</th>
              <th>Customer</th>
              <th className="num">Amount</th>
              <th className="num">Days overdue</th>
              <th>State</th>
              <th>Autonomy</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cases?.map((c) => (
              <tr key={c.id} onClick={() => navigate(`/cases/${c.id}`)}>
                <td>{c.title}</td>
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
        {cases && cases.length === 0 && <div className="empty-state">No open cases.</div>}
      </div>
    </div>
  );
}
