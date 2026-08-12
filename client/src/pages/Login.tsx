import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

// Dev-only user picker standing in for real SSO. Any seeded email signs in
// with no password — swap for a WorkOS/Auth0 redirect when credentials
// exist; nothing downstream of AuthContext needs to change.
const SEEDED_USERS = [
  { email: "priya@meridianmfg.com", name: "Priya Nandakumar", role: "CFO" },
  { email: "daniel@meridianmfg.com", name: "Daniel Osei", role: "Controller" },
  { email: "marisol@meridianmfg.com", name: "Marisol Vega", role: "AR Analyst" },
  { email: "tomasz@meridianmfg.com", name: "Tomasz Krawiec", role: "AR Analyst" },
  { email: "renee@meridianmfg.com", name: "Renee Ashworth", role: "Admin" },
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
      <div className="login-card">
        <h1>Sign in to Flux</h1>
        <p>Local development sign-in — pick a seeded user. Production wires this to SSO.</p>
        <div className="user-pick">
          {SEEDED_USERS.map((u) => (
            <button key={u.email} onClick={() => pick(u.email)}>
              <div>{u.name}</div>
              <div className="role">{u.role}</div>
            </button>
          ))}
        </div>
        {error && <p style={{ color: "var(--bad)", marginTop: 14, marginBottom: 0, fontSize: "0.85rem" }}>{error}</p>}
      </div>
    </div>
  );
}
