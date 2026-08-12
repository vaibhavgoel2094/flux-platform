import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { CustomerDetail } from "../api/types";
import { StatusChip } from "../components/StatusChip";

const TABS = ["Overview", "Invoices", "Cases", "Escalation contacts"] as const;
type Tab = (typeof TABS)[number];

export function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [contactForm, setContactForm] = useState({ name: "", email: "", role: "" });

  const load = () => api.get<CustomerDetail>(`/customers/${id}`).then(setCustomer);

  useEffect(() => {
    load();
  }, [id]);

  async function addContact() {
    if (!contactForm.name || !contactForm.email) return;
    await api.post(`/customers/${id}/escalation-contacts`, contactForm);
    setContactForm({ name: "", email: "", role: "" });
    await load();
  }

  async function toggleContact(contactId: string, active: boolean) {
    await api.put(`/customers/escalation-contacts/${contactId}`, { active: !active });
    await load();
  }

  if (!customer) return <div className="empty-state">Loading customer…</div>;

  const money = (n: number, currency = "GBP") => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(n);
  const outstanding = customer.invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <div className="page-head">
        <p className="page-eyebrow">
          <Link to="/customers">Customers</Link> / {customer.name}
        </p>
        <h1>{customer.name}</h1>
        <p>
          {customer.tier} · {customer.strategicStatus}
        </p>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <div key={t} className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </div>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid-3">
          <div className="card stat-card">
            <h4>Outstanding</h4>
            <div className="big">{money(outstanding)}</div>
          </div>
          <div className="card stat-card">
            <h4>Open invoices</h4>
            <div className="big">{customer.invoices.filter((i) => i.status !== "paid").length}</div>
          </div>
          <div className="card stat-card">
            <h4>Open cases</h4>
            <div className="big">{customer.cases.length}</div>
          </div>
        </div>
      )}

      {tab === "Invoices" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th className="num">Amount</th>
                <th>Due date</th>
                <th className="num">Days overdue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customer.invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNo}</td>
                  <td className="num">{money(inv.amount, inv.currency)}</td>
                  <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="num">{inv.daysOverdue}</td>
                  <td>
                    <StatusChip value={inv.status === "overdue" ? "Blocked" : inv.status === "paid" ? "Ready" : inv.status === "disputed" ? "Disputed" : "normal"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Cases" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>State</th>
                <th>Autonomy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customer.cases.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/cases/${c.id}`)}>
                  <td>{c.title}</td>
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
          {customer.cases.length === 0 && <div className="empty-state">No cases for this customer.</div>}
        </div>
      )}

      {tab === "Escalation contacts" && (
        <div>
          <div className="table-wrap" style={{ marginBottom: 20 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {customer.escalationContacts.map((c) => (
                  <tr key={c.id} style={{ cursor: "default" }}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.role}</td>
                    <td>
                      <button className="btn" onClick={() => toggleContact(c.id, c.active)}>
                        {c.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customer.escalationContacts.length === 0 && <div className="empty-state">No escalation contacts yet.</div>}
          </div>

          <div className="card" style={{ maxWidth: 420 }}>
            <h4 style={{ marginTop: 0 }}>Add escalation contact</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} style={{ padding: 8, border: "1px solid var(--line)", borderRadius: 6 }} />
              <input placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} style={{ padding: 8, border: "1px solid var(--line)", borderRadius: 6 }} />
              <input placeholder="Role (e.g. AP Director)" value={contactForm.role} onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })} style={{ padding: 8, border: "1px solid var(--line)", borderRadius: 6 }} />
              <button className="btn primary" onClick={addContact}>
                Add contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
