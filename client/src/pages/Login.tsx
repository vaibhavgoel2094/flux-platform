import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

// Two demo personas standing in for real SSO. Production wires this to
// WorkOS/Auth0 — nothing downstream of AuthContext needs to change.
const PERSONAS = [
  {
    email: "marisol@meridianmfg.com",
    name: "Marisol Vega",
    role: "AR Collector",
    description: "Works the Control Tower queue: reviews AI recommendations, approves or edits drafts, sends the final email.",
  },
  {
    email: "daniel@meridianmfg.com",
    name: "Daniel Osei",
    role: "Finance Manager",
    description: "Runs the release gate, authors playbooks and agent rules, reviews Assurance and portfolio analytics.",
  },
];

export function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  async function pick(email: string) {
    setError(null);
    try {
      await login(email);
    } catch {
      setError("Could not sign in. Has the database been seeded (npm run db:seed)?");
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card" style={{ width: 440 }}>
        <h1>Sign in to Flux</h1>
        <p>Choose a persona for today's demo. Production wires this to SSO.</p>
        <div className="user-pick">
          {PERSONAS.map((p) => (
            <button key={p.email} onClick={() => pick(p.email)} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong style={{ fontSize: "1rem" }}>{p.role}</strong>
                <span className="role">{p.name}</span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: 6 }}>{p.description}</div>
            </button>
          ))}
        </div>
        {error && <p style={{ color: "var(--bad)", marginTop: 14, marginBottom: 0, fontSize: "0.85rem" }}>{error}</p>}
      </div>
    </div>
  );
}
