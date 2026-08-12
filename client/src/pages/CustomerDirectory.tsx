import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { CustomerSummary } from "../api/types";
import { StatusChip } from "../components/StatusChip";

export function CustomerDirectory() {
  const [customers, setCustomers] = useState<CustomerSummary[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<CustomerSummary[]>("/customers").then(setCustomers);
  }, []);

  const money = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

  return (
    <div>
      <div className="page-head">
        <p className="page-eyebrow">Customers</p>
        <h1>Customer directory</h1>
        <p>Every account, its outstanding balance, and overdue exposure.</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Tier</th>
              <th className="num">Outstanding</th>
              <th className="num">Overdue invoices</th>
              <th className="num">Overdue amount</th>
            </tr>
          </thead>
          <tbody>
            {customers?.map((c) => (
              <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                <td>{c.name}</td>
                <td>
                  <StatusChip value={c.tier === "strategic" ? "Approval required" : "normal"} />
                </td>
                <td className="num">{money(c.outstanding)}</td>
                <td className="num">{c.overdueCount}</td>
                <td className="num">{money(c.overdueAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
