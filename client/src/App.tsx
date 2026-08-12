import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./state/AuthContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { ControlTower } from "./pages/ControlTower";
import { CaseDetail } from "./pages/CaseDetail";
import { CustomerDirectory } from "./pages/CustomerDirectory";
import { CustomerProfile } from "./pages/CustomerProfile";
import { Assurance } from "./pages/Assurance";
import { Analytics } from "./pages/Analytics";
import { Activity } from "./pages/Activity";
import { Playbooks } from "./pages/Playbooks";
import { AgentStudio } from "./pages/AgentStudio";
import { Copilot } from "./pages/Copilot";
import { Setup } from "./pages/Setup";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty-state">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<ControlTower />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/customers" element={<CustomerDirectory />} />
        <Route path="/customers/:id" element={<CustomerProfile />} />
        <Route path="/playbooks" element={<Playbooks />} />
        <Route path="/agent-studio" element={<AgentStudio />} />
        <Route path="/copilot" element={<Copilot />} />
        <Route path="/assurance" element={<Assurance />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/setup" element={<Setup />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
