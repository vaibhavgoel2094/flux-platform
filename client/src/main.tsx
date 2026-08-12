import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./styles/tokens.css";
import "./styles/app.css";
import App from "./App.tsx";

// HashRouter, not BrowserRouter: GitHub Pages serves static files with no
// server-side rewrite, so a direct link or refresh on /cases/:id would 404
// under path-based routing. Hash routing (/#/cases/:id) always resolves to
// index.html first, which is what a zero-infrastructure static host needs.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
