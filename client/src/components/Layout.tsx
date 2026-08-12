import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

const LINKS = [
  { to: "/", label: "Control Tower", end: true },
  { to: "/customers", label: "Customers" },
  { to: "/playbooks", label: "Playbooks" },
  { to: "/agent-studio", label: "Agent Studio" },
  { to: "/analytics", label: "Analytics" },
  { to: "/copilot", label: "Ask Flux" },
  { to: "/assurance", label: "Assurance" },
  { to: "/activity", label: "Activity" },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <nav className="nav">
        <div className="nav-brand">
          Flux Platform
          <small>Accounts receivable</small>
        </div>
        <div className="nav-links">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="nav-foot">
          <div className="nav-user">
            {user?.name}
            <small>{user?.role}</small>
          </div>
          <button className="nav-signout" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
