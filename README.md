# Flux Platform

The enterprise evolution of the Flux Collect capstone — a full AI accounts-receivable product, built to the Enterprise Blueprint spec. This is a separate, independent repository; the original [`ai-collections-agent`](https://github.com/vaibhavgoel2094/ai-collections-agent) capstone is untouched.

**Live demo:** https://vaibhavgoel2094.github.io/flux-platform/ — nothing to install, no terminal, no key required. Pick a persona and it works immediately in saved-evidence mode.

## What's in Phase 1

Control Tower, Customer 360, governed case review (draft → evidence → approve/edit/escalate → send email), the six-control Finance release gate, escalation contacts, a segment-based Playbook builder, Agent Studio (persona editor + per-intent automation toggles), a financial-health dashboard, the Ask Flux copilot, and a full activity/audit trail — across five agents (Collections, Billing, Deductions, Cash Application, Supplier & Payer).

## What makes a recommendation trustworthy here

Ported from Flux Collect's original `domain.js`, unchanged in logic, now living in `client/src/governance/` (and mirrored in `server/src/governance/` for the future managed deployment):

- **Autonomy ceiling** (`autonomy.ts`) — computed deterministically from case signals *before* the model runs. The model's proposed autonomy can only be downgraded from this ceiling, never upgraded past it.
- **Citation enforcement** (`citations.ts`) — a recommendation is only accepted if it cites both the record it's about and the policy it applied.
- **Output contract** (`outputContract.ts`) — a strict 17-field schema; an incomplete response is an explicit non-decision, never a silent fallback.
- **Release gate** — six controls a Finance Manager must run and pass before a queue reflects live decisions to the team.

## How this build runs — zero backend

The deployed demo is a fully static site: no server, no database to provision, no `.env` file to create.

- **Dataset**: `client/src/data/seed.json` — 188 synthetic customers, ~380 invoices, 233 cases for the fictional "Meridian Manufacturing Group," committed to the repo. Generated once by `scripts/generate-seed-data.mjs`; nothing to upload or run to see it.
- **Workspace state**: every review, analysis, and setting change is written to the browser's `localStorage`. Reset to the bundled dataset any time from **Setup**.
- **Auth**: a two-persona picker (AR Collector / Finance Manager) standing in for SSO — see **Setup** for what a real org-managed sign-in would replace it with.
- **Live AI**: connect an Anthropic API key from the in-product **Setup** page. It's held in `sessionStorage` only — never written to the dataset, never exported, gone when the tab closes — and calls go straight from the browser to Anthropic. Without a key, every case still runs a full saved-evidence analysis against the same governance rules; nothing is blocked.
- **Integrations** (ERP sync, direct email send, SSO): shown in Setup as **Coming soon** — the honest Phase 2 boundary, not hidden.

## Project layout

```
client/
  src/data/seed.json      the synthetic dataset — committed, not generated at runtime
  src/governance/         autonomy ceiling, citation validator, output contract, prompts, resolve
  src/localdb/            in-browser store: loads the bundled dataset, persists mutations to localStorage
  src/api/localApi.ts     fulfills the same get/post/put contract a real server would, entirely client-side
  src/anthropicBrowser.ts direct browser-to-Anthropic calls, BYO key from Setup
  src/pages/               ControlTower, CaseDetail, CustomerProfile, Playbooks, AgentStudio, Analytics,
                            Copilot, Assurance, Activity, Setup
scripts/generate-seed-data.mjs   regenerates client/src/data/seed.json — only needed if the dataset changes
docs/                    the built static site GitHub Pages serves (built from client/, vite base "/flux-platform/")
server/                  the future managed-deployment path — Express + Prisma/Postgres, same governance
                          logic, real auth and a real database. Not part of the live demo above.
```

## Rebuilding and redeploying the static site

```bash
cd client
npm install
npm run build        # outputs to ../docs (vite.config.ts: base "/flux-platform/", outDir "../docs")
```

Commit and push `docs/` on `main` — GitHub Pages is configured to serve from `main` / `/docs`.

## Roadmap

Phase 2: live ERP read integration, direct email send, real SSO, managed Postgres. Phase 3: the remaining Flux workflows named in the original capstone vision — Flux Pay, Flux Close, Flux Plan, Flux Cash.
