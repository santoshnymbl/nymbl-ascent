# Nymbl Ascent — Game-Based Candidate Screening System

## Overview

Nymbl Ascent is an interactive, game-based screening tool that serves as the first gate in Nymbl's hiring funnel. Candidates receive a unique link via email, play through three progressive stages (10–15 minutes), and are scored against Nymbl's 7 tenets and core values. The hiring team sees a ranked leaderboard with per-tenet breakdowns.

The system supports both tech and non-tech roles through a shared core assessment plus a role-specific layer.

## Nymbl Tenets & Core Values

**Tenets:** Client Focused, Empowering, Productive, Balanced, Reliable, Improving, Transparent

**Core Values:** Learn, Build & Grow — these map directly to the three assessment stages.

## Candidate Experience

### Access
- Candidates receive an email with a unique tokenized link (no account creation)
- Token identifies the candidate + role applied for
- Token expires after 7 days (configurable)
- Progress saves per stage — candidates can close the browser and resume
- After completion, the link shows "Already completed"

### Stage 1 — "Learn" (3 minutes)
Quick, gamified micro-rounds. All click/drag/tap — zero typing.

| Mini-game | What it measures | Tenets mapped |
|---|---|---|
| Priority Snap — 5 items flash on screen, drag into priority order under time pressure | Decision speed, prioritization instincts | Productive, Balanced |
| Value Match — match Nymbl values to real workplace situations (timed) | Cultural awareness, pattern recognition | Client Focused, Transparent |
| Odd One Out — spot the misaligned behavior in a set of 4 workplace actions | Judgment, attention to detail | Reliable, Improving |

Behavioral signals captured: response time per item, revision count, consistency across rounds.

### Stage 2 — "Build" (5 minutes)
2-3 branching workplace scenarios, each 2-3 layers deep. Candidate reads a situation, picks from 3-4 options, sees the consequence, then faces a follow-up decision. No typing required.

**Example scenario:**
> A client calls upset — they received the wrong deliverable. Your teammate who handled it is out sick. You have your own deadline in 2 hours.
> - A) Handle the client yourself immediately
> - B) Email your teammate to get context first
> - C) Escalate to your manager
> - D) Send the client an acknowledgment and promise a fix by EOD

Each choice leads to a different consequence and a new decision point. The full decision path is scored.

| What it measures | Tenets mapped |
|---|---|
| Trade-off reasoning across multiple steps | Client Focused, Empowering |
| Response to consequences of initial choices | Reliable, Transparent |
| Consistency of values across branching paths | Balanced, Improving |

### Stage 3 — "Grow" (5 minutes)
Role-specific challenge. Content adapts based on the role applied for.

- **Engineering:** Debug a logic puzzle, or evaluate competing technical approaches
- **Sales/BD:** Handle an objection in a simulated client conversation (branching format)
- **Operations:** Optimize a process given constraints (drag-and-drop)
- **Support:** Triage and prioritize incoming tickets

Maps to: Improving + role-specific competency.

### Transition Screens
Brief branded transitions between stages:
- After Stage 1: "Nice work! Now let's build."
- After Stage 2: "One more stage — show us how you grow."
- After Stage 3: "Thanks! We'll be in touch."

## Scoring & Evaluation

### Tenet Scoring
Each candidate receives a score (0–100) for each of the 7 tenets, derived from all three stages:

| Tenet | Stage 1 signals | Stage 2 signals | Stage 3 signals |
|---|---|---|---|
| Client Focused | Value Match accuracy | Client-facing decision paths | Role challenge (if applicable) |
| Empowering | Not measured in Stage 1 (requires scenario context) | Delegation/collaboration choices | Team-oriented choices |
| Productive | Priority Snap speed + accuracy | Efficiency of decision paths | Task completion rate |
| Balanced | Priority ordering patterns | Trade-off choices under pressure | Time management signals |
| Reliable | Consistency across rounds | Follow-through in branching consequences | Completion quality |
| Improving | Odd One Out accuracy | Adaptation after seeing consequences | Growth-oriented choices |
| Transparent | Value Match reasoning | Honesty-leaning decision paths | Communication clarity |

### Behavioral Signal Layer
Captured passively throughout all stages — weighted into tenet scores:

- **Decision speed** — unusually fast may signal random clicking
- **Revision patterns** — changing answers shows thoughtfulness (up to a point)
- **Consistency** — do Stage 1 choices align with Stage 2 decisions?
- **Consequence adaptation** — do they adjust strategy when a choice backfires?

### Composite Score
- **Core Values Score (60%):** Weighted average of all 7 tenet scores
- **Role Fit Score (25%):** Stage 3 performance
- **Behavioral Score (15%):** Aggregated behavioral signals

### Anti-Gaming Measures
- Scenario pools are randomized — candidates don't all get the same scenarios
- No "obviously correct" answers — all options reveal preference, not knowledge
- Behavioral signals catch pattern-gaming (e.g., always picking the first option)
- AI flags anomalies (impossibly fast completion, identical scores across all tenets)

## Tech Stack (MVP)

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js + TypeScript |
| ORM | Prisma |
| DB (dev) | SQLite |
| DB (prod) | Vercel Postgres (free tier) |
| AI Scoring | Claude API |
| Email | Nodemailer + Gmail SMTP |
| Admin Panel | Built-in, no auth (MVP) |
| Hosting | Vercel (free tier) |

### Key Architecture Decisions

- **No candidate accounts.** Unique tokenized links only. Zero signup friction.
- **Data-driven scenario engine.** Scenarios, branching paths, and scoring rubrics live in the database, not in code. HR manages them via the admin panel.
- **AI scoring is async.** Candidate completes assessment → decision paths queued for Claude API scoring → results ready in seconds. Dashboard shows "Scoring in progress" until complete.
- **Single codebase.** Candidate game, hiring team dashboard, and admin panel in one Next.js app with role-based routing.
- **Prisma ORM** enables SQLite locally and Postgres in production with zero code changes — just swap the connection string.

### Data Model

```
Candidate       → invited to a Role, has a unique token
Role            → has shared core scenarios + role-specific scenarios
Scenario        → has branching paths (tree structure), mapped tenets, scoring rubric
Assessment      → one candidate's playthrough — captures every choice + timestamp
Score           → computed per-tenet scores + composite + behavioral signals
```

## Admin Panel (No Auth for MVP)

### Scenario Manager
- Create/edit/delete scenarios with a visual branching path builder
- Each scenario node: situation text + 3-4 options + consequence text
- Tag each node with tenet mappings and scoring weights
- Preview mode — play through a scenario as a candidate would
- AI Assist — "Generate a scenario for [tenet] + [role type]" → HR reviews, edits, approves before publishing

### Role Manager
- Create roles (e.g., "Frontend Engineer", "Sales Rep")
- Assign shared core scenarios + role-specific scenarios per role
- Set scenario pool size (e.g., "pick 2 of 5 randomly per candidate")

### Candidate Manager
- Send invite emails (single or CSV bulk upload)
- View status: invited → in progress → completed → scored

### Results Dashboard
- Ranked candidate list per role, sortable by composite or individual tenet score
- Candidate detail view: per-tenet radar chart, decision path replay, behavioral signal summary
- Export to CSV

### AI Scenario Generation Flow
1. HR clicks "Generate Scenario"
2. Selects target tenets + role type
3. Claude generates a complete branching scenario (situation, options, consequences, 2-3 layers)
4. HR previews, edits branches/options, adjusts scoring weights
5. HR publishes to scenario pool

AI never publishes directly — HR always reviews and approves.

## Email Flow (Gmail SMTP)

| Email | Trigger | Content |
|---|---|---|
| Invite | HR sends from admin panel | Candidate name, role, unique assessment link |
| Reminder | Manual trigger from admin (MVP) | "You haven't completed your assessment yet" + same link |
| Completion | Candidate finishes all 3 stages | "Thanks for completing Nymbl Ascent" — no score revealed |
| Results Ready | AI scoring completes | Sent to hiring team — "New results available for [Role]" with dashboard link |

## Vercel Postgres Free Tier Limits
- 256 MB storage
- 60 compute hours/month
- Sufficient for MVP; monitor as candidate volume grows

## Future Enhancements (Post-MVP)
- Admin panel authentication (NextAuth.js)
- ATS integrations (Greenhouse, Lever, Workday)
- Automated reminder emails
- Cohort analytics and funnel metrics
- SSO for hiring team
- Dedicated email service (Resend/SendGrid) for higher volume
