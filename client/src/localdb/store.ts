// The entire "backend" for the zero-server build: a synthetic dataset
// bundled at build time (data/seed.json — checked into the repo, not
// generated at runtime) plus every mutation made during a session, held in
// localStorage. This is the same architecture pattern the reference
// capstone uses for its public GitHub Pages demo: no server, workspace
// state scoped to the visitor's browser, dataset always resettable to the
// original bundled snapshot.
import seedData from "../data/seed.json";
import type { Dataset, Workspace } from "./types";

const STORAGE_KEY = "flux.workspace.v1";

function freshWorkspace(): Workspace {
  const dataset = JSON.parse(JSON.stringify(seedData)) as Dataset;
  return { ...dataset, agentActions: [], caseReviews: [], evaluations: [], activity: [] };
}

let cached: Workspace | null = null;

function load(): Workspace {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cached = raw ? (JSON.parse(raw) as Workspace) : freshWorkspace();
  } catch {
    cached = freshWorkspace();
  }
  return cached;
}

function save() {
  if (cached) localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
}

export function getWorkspace(): Workspace {
  return load();
}

export function mutate<T>(fn: (ws: Workspace) => T): T {
  const ws = load();
  const result = fn(ws);
  save();
  return result;
}

export function resetWorkspace(): Workspace {
  cached = freshWorkspace();
  save();
  return cached;
}

export function datasetInfo() {
  const ws = load();
  return {
    orgName: ws.org.name,
    customers: ws.customers.length,
    invoices: ws.invoices.length,
    cases: ws.cases.length,
    activityEntries: ws.activity.length,
  };
}
