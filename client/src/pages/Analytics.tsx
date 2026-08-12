import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Analytics as AnalyticsType } from "../api/types";

export function Analytics() {
  const [data, setData] = useState<AnalyticsType | null>(null);

  useEffect(() => {
    api.get<AnalyticsType>("/analytics").then(setData);
  }, []);

  if (!data) return <div className="empty-state">Loading analytics…</div>;

  const money = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
  const agingEntries = Object.entries(data.aging);
  const maxAging = Math.max(...agingEntries.map(([, v]) => v), 1);
  const maxReason = Math.max(...data.topReasons.map((r) => r.count), 1);

  return (
    <div>
      <div className="page-head">
        <p className="page-eyebrow">Analytics</p>
        <h1>Financial health</h1>
        <p>The numbers a Controller checks weekly, computed from live invoice data.</p>
      </div>

      <div className="grid-3">
        <div className="card stat-card">
          <h4>Days sales outstanding</h4>
          <div className="big">{data.dso}</div>
        </div>
        <div className="card stat-card">
          <h4>Total receivable</h4>
          <div className="big">{money(data.totalReceivable)}</div>
        </div>
        <div className="card stat-card">
          <h4>Collected</h4>
          <div className="big">{money(data.collected)}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h4 style={{ marginTop: 0 }}>Aging snapshot</h4>
          {agingEntries.map(([bucket, amount]) => (
            <div key={bucket} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                <span className="mono">{bucket} days</span>
                <span className="mono">{money(amount)}</span>
              </div>
              <div style={{ background: "var(--paper)", borderRadius: 4, height: 8 }}>
                <div style={{ width: `${(amount / maxAging) * 100}%`, background: bucket === "current" ? "var(--good)" : bucket === "90+" ? "var(--bad)" : "var(--warn)", height: 8, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h4 style={{ marginTop: 0 }}>Top reasons for late payment</h4>
          {data.topReasons.map((r) => (
            <div key={r.reason} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                <span>{r.reason}</span>
                <span className="mono">{r.count}</span>
              </div>
              <div style={{ background: "var(--paper)", borderRadius: 4, height: 8 }}>
                <div style={{ width: `${(r.count / maxReason) * 100}%`, background: "var(--accent)", height: 8, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
