# Flux Platform

The enterprise evolution of the Flux Collect capstone — a multi-tenant AI accounts-receivable platform, built to the [Enterprise Blueprint](../AI%20Lead%20gen) spec. This is a separate, independent repository; the original `ai-collections-agent` capstone is untouched.

Ships today: the Tier-1 pilot-ready MVP — Control Tower, Customer 360, case review with governance-enforced AI recommendations, the six-control Finance release gate, escalation contacts, an audit trail, and a financial health dashboard (DSO, aging, top late-payment reasons).

## What makes a recommendation trustworthy here

Ported and generalized from Flux Collect's `domain.js`, now living in `server/src/governance/`:

- **Autonomy ceiling** (`autonomy.ts`) — computed deterministically from case signals *before* the model runs. The model's proposed autonomy can only be downgraded from this ceiling, never upgraded past it.
- **Citation enforcement** (`citations.ts`) — a recommendation is only accepted if it cites both the record it's about and the policy it applied.
- **Output contract** (`outputContract.ts`) — a strict 17-field schema; an incomplete response is an explicit non-decision, never a silent fallback.
- **Release gate** (`routes/evaluations.ts`) — six controls a Controller must run and pass before a queue reflects live decisions to the team.

## Stack

- **Server**: Express 5 + TypeScript + Prisma. SQLite for local dev (zero setup); the schema is Postgres-compatible for deploy — swap `DATABASE_URL` and the `provider` in `prisma/schema.prisma`.
- **Client**: React 19 + Vite + TypeScript + React Router.
- **AI**: Claude (Sonnet) via `@anthropic-ai/sdk`, one system prompt per agent type in `governance/prompts.ts`.
- **Auth**: a dev-only email picker (`routes/auth.ts`) standing in for real SSO. Swap the cookie lookup in `middleware/auth.ts` for WorkOS/Auth0 when you have provider accounts — nothing downstream changes.

## Run locally

```bash
npm install
cp server/.env.example server/.env   # add ANTHROPIC_API_KEY for live analysis; saved-evidence mode works without it
npm run db:push
npm run db:seed
npm run dev
```

Client: http://localhost:5173 (proxies `/api` to the server on :4000). Sign in as any seeded user, e.g. `daniel@meridianmfg.com` (Controller) or `marisol@meridianmfg.com` (AR Analyst).

## Project layout

```
server/
  prisma/schema.prisma   org, user, customer, invoice, case, agentAction, caseReview, evaluation, activityEntry
  src/governance/        autonomy ceiling, citation validator, output contract, prompts, resolve
  src/routes/            auth, bootstrap, customers, cases, evaluations, activity, analytics
  src/seed/seed.ts       fresh synthetic org "Meridian Manufacturing Group" — 8 customers, invoices, cases
client/
  src/pages/             Login, ControlTower, CaseDetail, CustomerDirectory, CustomerProfile, Assurance, Analytics, Activity
```

## Roadmap

See the Enterprise Blueprint for the full phased plan. Next up (Tier 2): Billing and Cash Application agents, the segment-based playbook/cadence builder, Agent Studio (persona editor + per-intent automation toggles), and a live ERP read integration.
