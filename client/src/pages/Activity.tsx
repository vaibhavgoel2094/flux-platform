import { Fragment, useEffect, useState } from "react";
import { api } from "../api/client";
import { downloadActivityExport } from "../api/localApi";
import type { ActivityItem } from "../api/types";

export function Activity() {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.get<ActivityItem[]>("/activity").then(setItems);
  }, []);

  return (
    <div>
      <div className="page-head">
        <p className="page-eyebrow">Activity</p>
        <h1>Audit trail</h1>
        <p>Every agent analysis and human decision, exportable for review.</p>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={downloadActivityExport}>
            Export JSON
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => (
              <Fragment key={item.id}>
                <tr onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                  <td className="mono" style={{ whiteSpace: "nowrap" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td>
                    {item.actorType === "agent" ? "🤖" : "🧑"} {item.actorName}
                  </td>
                  <td>{item.summary}</td>
                </tr>
                {expanded === item.id && (
                  <tr style={{ cursor: "default" }}>
                    <td colSpan={3} style={{ background: "var(--paper)" }}>
                      <pre className="mono" style={{ margin: 0, fontSize: "0.78rem", whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(item.detail, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {items && items.length === 0 && <div className="empty-state">No activity recorded yet.</div>}
      </div>
    </div>
  );
}
