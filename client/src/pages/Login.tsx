import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

// The seeded workspace's full user list standing in for real SSO.
// Production wires this to WorkOS/Auth0 — nothing downstream of
// AuthContext needs to change.
const PERSONAS = [
  {
    email: "priya@meridianmfg.com",
    name: "Priya Nandakumar",
    role: "CFO",
    description: "Reviews portfolio analytics and Assurance evidence — the executive view of the pilot.",
  },
  {
    email: "daniel@meridianmfg.com",
    name: "Daniel Osei",
    role: "Finance Manager",
    description: "Runs the release gate, authors playbooks and agent rules, reviews Assurance and portfolio analytics.",
  },
  {
    email: "marisol@meridianmfg.com",
    name: "Marisol Vega",
    role: "AR Collector",
    description: "Works the Control Tower queue: reviews AI recommendations, approves or edits drafts, sends the final email.",
  },
  {
    email: "tomasz@meridianmfg.com",
    name: "Tomasz Krawiec",
    role: "AR Collector",
    description: "Second AR seat, working the same Control Tower queue as Marisol.",
  },
  {
    email: "renee@meridianmfg.com",
    name: "Renee Ashworth",
    role: "Admin",
    description: "Owns Agent Studio roles and automation rules, and workspace Setup.",
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
      setError("Could not sign in. Try resetting the workspace from Setup if this persists.");
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card" style={{ width: 460 }}>
        <h1>Sign in to Flux</h1>
        <p>Choose a persona for today's demo. Production wires this to SSO.</p>
        <div className="user-pick">
          {PERSONAS.map((p) => (
            <button key={p.email} onClick={() => pick(p.email)} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong style={{ fontSize: "1rem" }}>{p.name}</strong>
                <span className="role">{p.role}</span>
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
