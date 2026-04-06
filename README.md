# Nymbl Ascent

A psychology-grounded, game-based candidate screening system built around Nymbl's seven tenets: **Client Focused, Empowering, Productive, Balanced, Reliable, Improving, Transparent**.

Instead of testing knowledge or letting candidates rehearse "right answers," Nymbl Ascent measures *values* and *behavior* through forced-choice games, branching workplace scenarios, and role-specific challenges.

## What it does

A three-stage assessment that reveals how a candidate actually thinks and prioritizes:

- **Stage 1 — Reveal:** Four short, click-only games designed around organizational psychology principles. No "correct" answers — every choice maps to a tenet profile.
  - **Triage Tower** — in-basket exercise with one-at-a-time tasks and an interrupt
  - **Trade-Off Tiles** — forced-choice ipsative slider pitting tenets against each other
  - **Signal Sort** — projective categorization of ambiguous workplace messages
  - **Resource Roulette** — token allocation with a curveball that forces re-allocation
- **Stage 2 — Build:** Branching workplace scenarios drawn from a pool attached to the role. Includes resource bars (Time / Team Energy / Client Trust) and a reflection beat to cross-validate stated vs. revealed values.
- **Stage 3 — Grow:** Role-specific challenge that tests practical skills alongside the tenets.

After completion, scoring runs automatically:

```
Composite = Tenets × 0.6  +  Role Fit × 0.25  +  Behavioral × 0.15
```

The behavioral score factors in cross-stage consistency, time entropy, position-bias detection, and reflection-vs-behavior delta to flag faking.

## Admin features

- **Roles** — create roles with a job description, set the Stage 2 pool size, optionally **auto-generate a Stage 3 challenge** from the JD using the Anthropic API
- **Scenarios** — author Stage 1/2/3 scenarios; AI-assisted generation
- **Manage Scenarios per role** — attach Stage 2 and Stage 3 scenarios to specific roles
- **Candidates** — single invite or CSV bulk upload, tokenized magic-link access
- **Results** — sortable table with per-tenet breakdowns and AI-generated qualitative analysis
- **Scoring page** — interactive explanation of how every score is computed
- **How-To guide** — walkthrough for HR users
- **Dashboard** — aggregate stats with light/dark theming

## Tech stack

- **Next.js 16** (App Router, Turbopack) + React 19
- **TypeScript** strict mode
- **Prisma 7** with `@prisma/adapter-libsql`
- **SQLite** (local) / **Turso** (production) — same schema, swap via env vars
- **Tailwind CSS v4** with a custom CSS-variable design system (glassmorphism + dark cinema)
- **Anthropic SDK** for AI scenario generation and qualitative scoring
- **Nodemailer** for candidate invites (Gmail SMTP by default)
- **lucide-react**, **Space Grotesk**, **DM Sans**

## Getting started

### Prerequisites
- Node 20+
- An Anthropic API key (for AI generation; optional for basic use)
- A Turso database (production) or local SQLite (dev)

### Setup

```bash
git clone https://github.com/santoshnymbl/nymbl-ascent.git
cd nymbl-ascent
npm install
cp .env.example .env.local
# fill in your secrets
npx prisma db push   # creates tables (local SQLite or Turso, based on DATABASE_URL)
npx tsx prisma/seed.ts   # seeds roles, scenarios, sample candidate
npm run dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.
The seeded test candidate's link is logged in the console after seeding.

### Environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | `file:./dev.db` for local, `libsql://...` for Turso |
| `TURSO_AUTH_TOKEN` | Required when using Turso |
| `ANTHROPIC_API_KEY` | Enables AI scenario generation and qualitative scoring |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Sends candidate invites via Gmail SMTP |
| `NEXT_PUBLIC_BASE_URL` | Public URL used in invite links |

### Migrate local SQLite → Turso

A one-shot script copies your dev database into Turso:

```bash
npx tsx scripts/migrate-to-turso.ts
```

It reads schema and rows from `dev.db` and writes them to the Turso URL in `.env.local`.

## Project structure

```
src/
  app/
    admin/          Admin panel (roles, scenarios, candidates, results, scoring, how-to)
    assess/[token]/ Candidate assessment flow (stage1, stage2, stage3, complete)
    api/            REST endpoints (admin + candidate-facing)
  components/
    games/          Stage 1 game components (TriageTower, TradeOffTiles, ...)
    scenarios/      Stage 2 BranchingScenario renderer
    ui/             Shared UI primitives (Select, Tooltip, Timer, etc.)
  lib/
    db.ts           Prisma client with libsql adapter
    scoring.ts      Tenet, role-fit, behavioral, and composite scoring
    ai-generate.ts  Anthropic-powered scenario generation
    ai-scoring.ts   Qualitative analysis via Claude
prisma/
  schema.prisma     Role / Scenario / Candidate / Assessment / Score models
  seed.ts           Default roles + scenarios
scripts/
  migrate-to-turso.ts   One-shot SQLite → Turso migration
```

## Status

Internal tool, actively developed. Not open for external contributions yet.
