# Nymbl Ascent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a game-based candidate screening web app where applicants play through 3 progressive stages (Learn → Build → Grow) and are scored against Nymbl's 7 tenets, with an admin panel for HR to manage scenarios and view ranked results.

**Architecture:** Single Next.js app with three route groups — candidate assessment (`/assess/[token]`), admin panel (`/admin`), and API routes (`/api`). Prisma ORM abstracts SQLite (dev) / Postgres (prod). Claude API scores decision paths async. Gmail SMTP sends invite/completion emails via Nodemailer.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Prisma, SQLite/Postgres, Tailwind CSS, Claude API (@anthropic-ai/sdk), Nodemailer, Jest + React Testing Library, Vitest for API tests.

**Spec:** `docs/superpowers/specs/2026-04-03-nymbl-ascent-design.md`

---

## File Structure

```
├── prisma/
│   ├── schema.prisma              # All data models
│   └── seed.ts                    # Sample roles, scenarios, candidates
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with Tailwind
│   │   ├── page.tsx               # Landing redirect
│   │   ├── assess/
│   │   │   └── [token]/
│   │   │       ├── page.tsx       # Welcome screen
│   │   │       ├── stage1/
│   │   │       │   └── page.tsx   # Learn — 3 mini-games
│   │   │       ├── stage2/
│   │   │       │   └── page.tsx   # Build — branching scenarios
│   │   │       ├── stage3/
│   │   │       │   └── page.tsx   # Grow — role-specific
│   │   │       └── complete/
│   │   │           └── page.tsx   # Completion screen
│   │   ├── admin/
│   │   │   ├── layout.tsx         # Admin shell with sidebar nav
│   │   │   ├── page.tsx           # Dashboard overview
│   │   │   ├── roles/
│   │   │   │   └── page.tsx       # Role CRUD
│   │   │   ├── scenarios/
│   │   │   │   ├── page.tsx       # Scenario list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Branching path editor
│   │   │   ├── candidates/
│   │   │   │   └── page.tsx       # Invite + status tracking
│   │   │   └── results/
│   │   │       ├── page.tsx       # Ranked list per role
│   │   │       └── [id]/
│   │   │           └── page.tsx   # Candidate detail + radar chart
│   │   └── api/
│   │       ├── assess/
│   │       │   ├── validate/route.ts   # Token validation
│   │       │   ├── progress/route.ts   # Save/load stage progress
│   │       │   └── submit/route.ts     # Final submission → trigger scoring
│   │       ├── admin/
│   │       │   ├── roles/route.ts
│   │       │   ├── scenarios/route.ts
│   │       │   ├── scenarios/[id]/route.ts
│   │       │   ├── candidates/route.ts
│   │       │   ├── candidates/invite/route.ts
│   │       │   └── results/route.ts
│   │       ├── scoring/route.ts        # AI scoring endpoint
│   │       └── ai/generate/route.ts    # AI scenario generation
│   ├── lib/
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── token.ts               # Token generation + validation
│   │   ├── scoring.ts             # Tenet + behavioral + composite scoring
│   │   ├── ai-scoring.ts          # Claude API integration for scoring
│   │   ├── ai-generate.ts         # Claude API for scenario generation
│   │   └── email.ts               # Nodemailer + Gmail SMTP
│   ├── components/
│   │   ├── games/
│   │   │   ├── PrioritySnap.tsx   # Drag-and-drop prioritization
│   │   │   ├── ValueMatch.tsx     # Timed value-to-situation matching
│   │   │   └── OddOneOut.tsx      # Spot the misaligned behavior
│   │   ├── scenarios/
│   │   │   └── BranchingScenario.tsx  # Branching choice engine
│   │   ├── admin/
│   │   │   ├── ScenarioBuilder.tsx    # Visual branch editor
│   │   │   ├── RadarChart.tsx         # Per-tenet radar chart
│   │   │   └── CsvUpload.tsx          # Bulk candidate CSV import
│   │   └── ui/
│   │       ├── StageTransition.tsx    # Animated transition screens
│   │       ├── Timer.tsx              # Countdown timer
│   │       └── ProgressBar.tsx        # Stage progress indicator
│   └── types/
│       └── index.ts               # Shared TypeScript types
├── __tests__/
│   ├── lib/
│   │   ├── token.test.ts
│   │   ├── scoring.test.ts
│   │   ├── ai-scoring.test.ts
│   │   └── email.test.ts
│   ├── api/
│   │   ├── assess-validate.test.ts
│   │   ├── assess-submit.test.ts
│   │   ├── admin-roles.test.ts
│   │   └── admin-scenarios.test.ts
│   └── components/
│       ├── PrioritySnap.test.tsx
│       ├── ValueMatch.test.tsx
│       ├── OddOneOut.test.tsx
│       └── BranchingScenario.test.tsx
├── .env.example
├── .env.local                     # Local secrets (not committed)
├── package.json
├── tsconfig.json
├── next.config.ts
├── jest.config.ts
├── tailwind.config.ts
└── postcss.config.js
```

---

## Phase 1: Foundation

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `jest.config.ts`, `.env.example`, `.env.local`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd G:/Horizon/HugoMind
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. This creates the base Next.js + TypeScript + Tailwind project.

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client @anthropic-ai/sdk nodemailer uuid
npm install -D @types/nodemailer @types/uuid jest @jest/globals ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:

```typescript
import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterSetup: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default createJestConfig(config);
```

Create `jest.setup.ts`:

```typescript
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Create `.env.example` and `.env.local`**

Create `.env.example`:

```env
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

Copy `.env.example` to `.env.local` and fill in actual values.

- [ ] **Step 5: Update root layout with Nymbl branding**

Edit `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nymbl Ascent",
  description: "Game-based candidate screening by Nymbl",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: Next.js dev server starts at `http://localhost:3000` with no errors.

- [ ] **Step 7: Verify tests run**

Create `__tests__/smoke.test.ts`:

```typescript
describe("smoke test", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

```bash
npx jest --passWithNoTests
```

Expected: 1 test passes.

- [ ] **Step 8: Commit**

```bash
git init
echo "node_modules/\n.env.local\nprisma/dev.db\n.next/" > .gitignore
git add .
git commit -m "feat: scaffold Next.js project with Tailwind, Jest, and dependencies"
```

---

### Task 2: Database Schema

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`, `src/types/index.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 2: Write the Prisma schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Role {
  id             String       @id @default(uuid())
  name           String       @unique
  description    String       @default("")
  corePoolSize   Int          @default(2)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  candidates     Candidate[]
  roleScenarios  RoleScenario[]
}

model Scenario {
  id          String         @id @default(uuid())
  title       String
  stage       Int            // 1, 2, or 3
  type        String         // "core" or "role-specific"
  roleType    String?        // null for core, e.g. "engineering", "sales" for role-specific
  tree        String         // JSON string: branching tree structure
  tenets      String         // JSON string: array of tenet names this scenario evaluates
  scoringRubric String       // JSON string: scoring rules per path
  isPublished Boolean        @default(false)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  roleScenarios RoleScenario[]
}

model RoleScenario {
  id         String   @id @default(uuid())
  roleId     String
  scenarioId String
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  scenario   Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)

  @@unique([roleId, scenarioId])
}

model Candidate {
  id          String       @id @default(uuid())
  name        String
  email       String
  roleId      String
  token       String       @unique
  tokenExpiry DateTime
  status      String       @default("invited") // invited, in_progress, completed, scored
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  role        Role         @relation(fields: [roleId], references: [id])
  assessment  Assessment?
}

model Assessment {
  id            String   @id @default(uuid())
  candidateId   String   @unique
  currentStage  Int      @default(0)   // 0 = not started, 1, 2, 3
  stage1Data    String?  // JSON: choices, timestamps, behavioral signals
  stage2Data    String?  // JSON: decision paths per scenario
  stage3Data    String?  // JSON: role-specific challenge results
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  candidate     Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  score         Score?
}

model Score {
  id              String   @id @default(uuid())
  assessmentId    String   @unique
  clientFocused   Float    @default(0)
  empowering      Float    @default(0)
  productive      Float    @default(0)
  balanced        Float    @default(0)
  reliable        Float    @default(0)
  improving       Float    @default(0)
  transparent     Float    @default(0)
  roleFitScore    Float    @default(0)
  behavioralScore Float    @default(0)
  compositeScore  Float    @default(0)
  breakdown       String?  // JSON: detailed scoring breakdown
  aiAnalysis      String?  // JSON: Claude's qualitative analysis
  scoredAt        DateTime @default(now())
  assessment      Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 3: Create Prisma client singleton**

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Create shared TypeScript types**

Create `src/types/index.ts`:

```typescript
export const TENETS = [
  "clientFocused",
  "empowering",
  "productive",
  "balanced",
  "reliable",
  "improving",
  "transparent",
] as const;

export type Tenet = (typeof TENETS)[number];

export const TENET_LABELS: Record<Tenet, string> = {
  clientFocused: "Client Focused",
  empowering: "Empowering",
  productive: "Productive",
  balanced: "Balanced",
  reliable: "Reliable",
  improving: "Improving",
  transparent: "Transparent",
};

export interface ScenarioNode {
  id: string;
  text: string;
  options?: ScenarioOption[];
}

export interface ScenarioOption {
  id: string;
  label: string;
  text: string;
  consequence: string;
  nextNodeId?: string;
  scores: Partial<Record<Tenet, number>>; // -10 to +10 per tenet
}

export interface ScenarioTree {
  rootNodeId: string;
  nodes: Record<string, ScenarioNode>;
}

export interface BehavioralSignal {
  event: string;      // e.g., "choice_made", "revision", "drag_complete"
  timestamp: number;  // ms since stage start
  data: Record<string, unknown>;
}

export interface Stage1Result {
  prioritySnap: {
    order: string[];
    timeMs: number;
    revisions: number;
  };
  valueMatch: {
    matches: { valueId: string; situationId: string; correct: boolean }[];
    timeMs: number;
  };
  oddOneOut: {
    picks: { roundId: string; chosenId: string; correct: boolean }[];
    timeMs: number;
  };
  signals: BehavioralSignal[];
}

export interface Stage2Result {
  scenarios: {
    scenarioId: string;
    path: { nodeId: string; choiceId: string; timeMs: number }[];
  }[];
  signals: BehavioralSignal[];
}

export interface Stage3Result {
  challengeType: string;
  responses: Record<string, unknown>;
  timeMs: number;
  signals: BehavioralSignal[];
}

export type CandidateStatus = "invited" | "in_progress" | "completed" | "scored";
```

- [ ] **Step 5: Run Prisma migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration created, `prisma/dev.db` generated.

- [ ] **Step 6: Generate Prisma client**

```bash
npx prisma generate
```

Expected: Prisma Client generated successfully.

- [ ] **Step 7: Commit**

```bash
git add prisma/ src/lib/db.ts src/types/index.ts
git commit -m "feat: add Prisma schema with Role, Scenario, Candidate, Assessment, Score models"
```

---

### Task 3: Seed Data

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed script)

- [ ] **Step 1: Write seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();

async function main() {
  // --- Roles ---
  const engRole = await prisma.role.create({
    data: {
      name: "Frontend Engineer",
      description: "Build user-facing web applications",
      corePoolSize: 2,
    },
  });

  const salesRole = await prisma.role.create({
    data: {
      name: "Sales Representative",
      description: "Drive revenue through client relationships",
      corePoolSize: 2,
    },
  });

  // --- Stage 1 Scenarios (core) ---
  const prioritySnap = await prisma.scenario.create({
    data: {
      title: "Priority Snap",
      stage: 1,
      type: "core",
      tenets: JSON.stringify(["productive", "balanced"]),
      scoringRubric: JSON.stringify({
        correctOrder: ["client-issue", "team-blocker", "own-deadline", "nice-to-have", "admin-task"],
        timeBonus: { under15s: 5, under30s: 3, under60s: 1 },
      }),
      tree: JSON.stringify({
        type: "priority-snap",
        items: [
          { id: "client-issue", label: "Resolve client-reported bug", weight: 5 },
          { id: "team-blocker", label: "Unblock teammate's PR", weight: 4 },
          { id: "own-deadline", label: "Finish your feature by EOD", weight: 3 },
          { id: "nice-to-have", label: "Refactor legacy code", weight: 2 },
          { id: "admin-task", label: "Update your timesheet", weight: 1 },
        ],
      }),
      isPublished: true,
    },
  });

  const valueMatch = await prisma.scenario.create({
    data: {
      title: "Value Match",
      stage: 1,
      type: "core",
      tenets: JSON.stringify(["clientFocused", "transparent"]),
      scoringRubric: JSON.stringify({
        correctMatches: {
          "client-focused": "situation-client",
          "transparent": "situation-transparent",
          "empowering": "situation-empowering",
          "reliable": "situation-reliable",
        },
      }),
      tree: JSON.stringify({
        type: "value-match",
        values: [
          { id: "client-focused", label: "Client Focused" },
          { id: "transparent", label: "Transparent" },
          { id: "empowering", label: "Empowering" },
          { id: "reliable", label: "Reliable" },
        ],
        situations: [
          { id: "situation-client", text: "You drop everything to help a customer who's stuck, even though it's not your ticket." },
          { id: "situation-transparent", text: "You share a project delay with stakeholders immediately rather than trying to fix it quietly." },
          { id: "situation-empowering", text: "You teach a junior colleague how to solve the problem instead of solving it for them." },
          { id: "situation-reliable", text: "You deliver your part on time every sprint, even when priorities shift." },
        ],
      }),
      isPublished: true,
    },
  });

  const oddOneOut = await prisma.scenario.create({
    data: {
      title: "Odd One Out",
      stage: 1,
      type: "core",
      tenets: JSON.stringify(["reliable", "improving"]),
      scoringRubric: JSON.stringify({
        rounds: [
          { roundId: "r1", correctId: "r1-c" },
          { roundId: "r2", correctId: "r2-b" },
          { roundId: "r3", correctId: "r3-d" },
        ],
      }),
      tree: JSON.stringify({
        type: "odd-one-out",
        rounds: [
          {
            id: "r1",
            prompt: "Which behavior doesn't belong?",
            options: [
              { id: "r1-a", text: "Admitting a mistake to a client" },
              { id: "r1-b", text: "Sharing honest progress updates" },
              { id: "r1-c", text: "Hiding a bug you caused and hoping nobody notices" },
              { id: "r1-d", text: "Flagging a risk before it becomes a problem" },
            ],
          },
          {
            id: "r2",
            prompt: "Which behavior doesn't belong?",
            options: [
              { id: "r2-a", text: "Asking for help when stuck" },
              { id: "r2-b", text: "Refusing to learn a new tool because you prefer the old one" },
              { id: "r2-c", text: "Taking a course to improve a weak skill" },
              { id: "r2-d", text: "Requesting feedback on your work" },
            ],
          },
          {
            id: "r3",
            prompt: "Which behavior doesn't belong?",
            options: [
              { id: "r3-a", text: "Meeting every deadline you commit to" },
              { id: "r3-b", text: "Following through on promises to teammates" },
              { id: "r3-c", text: "Delivering consistent quality across projects" },
              { id: "r3-d", text: "Overpromising to impress your manager" },
            ],
          },
        ],
      }),
      isPublished: true,
    },
  });

  // --- Stage 2 Scenarios (core, branching) ---
  const branchScenario1 = await prisma.scenario.create({
    data: {
      title: "The Client Escalation",
      stage: 2,
      type: "core",
      tenets: JSON.stringify(["clientFocused", "empowering", "reliable", "transparent"]),
      scoringRubric: JSON.stringify({
        pathScores: {
          "root->a->a1": { clientFocused: 8, reliable: 7, empowering: 3 },
          "root->a->a2": { clientFocused: 9, reliable: 6, transparent: 7 },
          "root->b->b1": { clientFocused: 4, reliable: 5, transparent: 3 },
          "root->b->b2": { clientFocused: 5, reliable: 6, empowering: 4 },
          "root->c->c1": { clientFocused: 5, empowering: 2, reliable: 6 },
          "root->c->c2": { clientFocused: 6, empowering: 5, transparent: 8 },
          "root->d->d1": { clientFocused: 7, transparent: 8, reliable: 7 },
          "root->d->d2": { clientFocused: 8, transparent: 6, empowering: 6 },
        },
      }),
      tree: JSON.stringify({
        rootNodeId: "root",
        nodes: {
          root: {
            id: "root",
            text: "A client calls upset — they received the wrong deliverable. Your teammate who handled it is out sick. You have your own deadline in 2 hours.",
            options: [
              { id: "a", label: "A", text: "Handle the client yourself immediately", consequence: "You spend 45 minutes resolving the issue. The client is grateful but your own deadline is now tight.", nextNodeId: "node-a", scores: { clientFocused: 8, productive: 3 } },
              { id: "b", label: "B", text: "Email your teammate to get context first", consequence: "Your teammate is sick and doesn't respond for hours. The client follows up again, more frustrated.", nextNodeId: "node-b", scores: { clientFocused: 2, reliable: 3 } },
              { id: "c", label: "C", text: "Escalate to your manager", consequence: "Your manager handles it but later asks why you didn't try to resolve it yourself first.", nextNodeId: "node-c", scores: { empowering: 2, reliable: 5 } },
              { id: "d", label: "D", text: "Send the client an acknowledgment and promise a fix by EOD", consequence: "The client appreciates the quick response. You now have a commitment to deliver by end of day.", nextNodeId: "node-d", scores: { clientFocused: 6, transparent: 7 } },
            ],
          },
          "node-a": {
            id: "node-a",
            text: "You fixed the client issue but now have 75 minutes for your own deadline. What do you do?",
            options: [
              { id: "a1", label: "A", text: "Power through — skip lunch and deliver on time", consequence: "You deliver on time but are burnt out for the rest of the week.", scores: { productive: 8, balanced: 2, reliable: 8 } },
              { id: "a2", label: "B", text: "Tell your manager you need an extension and explain why", consequence: "Your manager appreciates the transparency and gives you until tomorrow.", scores: { transparent: 9, balanced: 7, reliable: 5 } },
            ],
          },
          "node-b": {
            id: "node-b",
            text: "The client has followed up twice now. Your teammate still hasn't responded. What do you do?",
            options: [
              { id: "b1", label: "A", text: "Finally jump in and try to fix it yourself", consequence: "You resolve it, but the delay damaged the client relationship.", scores: { clientFocused: 5, reliable: 4 } },
              { id: "b2", label: "B", text: "Loop in your manager and explain the situation", consequence: "Your manager helps resolve it and suggests a process for handling absent teammates.", scores: { transparent: 6, improving: 7 } },
            ],
          },
          "node-c": {
            id: "node-c",
            text: "Your manager asks you to take ownership of client issues when teammates are unavailable going forward. How do you respond?",
            options: [
              { id: "c1", label: "A", text: "Agree but ask for clearer escalation guidelines", consequence: "You and your manager create a documented process. The team benefits.", scores: { improving: 8, empowering: 6, transparent: 5 } },
              { id: "c2", label: "B", text: "Push back — it's not your responsibility", consequence: "Your manager is disappointed. The issue remains unresolved.", scores: { empowering: 1, clientFocused: 1 } },
            ],
          },
          "node-d": {
            id: "node-d",
            text: "It's 4 PM. You still haven't resolved the client's issue, and your own deadline is in 1 hour. What do you do?",
            options: [
              { id: "d1", label: "A", text: "Prioritize the client promise — you committed to EOD", consequence: "Client issue resolved. You ask for an extension on your own task. Trust maintained.", scores: { clientFocused: 9, reliable: 8, transparent: 6 } },
              { id: "d2", label: "B", text: "Hit your own deadline first, then address the client", consequence: "You deliver your work but miss the EOD promise to the client.", scores: { productive: 7, clientFocused: 3, reliable: 4 } },
            ],
          },
        },
      } as object),
      isPublished: true,
    },
  });

  const branchScenario2 = await prisma.scenario.create({
    data: {
      title: "The Quality vs. Speed Dilemma",
      stage: 2,
      type: "core",
      tenets: JSON.stringify(["productive", "balanced", "improving", "transparent"]),
      scoringRubric: JSON.stringify({
        pathScores: {
          "root->a->a1": { productive: 5, balanced: 8, improving: 7 },
          "root->a->a2": { productive: 7, balanced: 4, improving: 4 },
          "root->b->b1": { productive: 8, balanced: 3, improving: 3 },
          "root->b->b2": { productive: 6, transparent: 8, balanced: 6 },
          "root->c->c1": { productive: 4, transparent: 7, improving: 8 },
          "root->c->c2": { productive: 3, balanced: 7, improving: 5 },
        },
      }),
      tree: JSON.stringify({
        rootNodeId: "root",
        nodes: {
          root: {
            id: "root",
            text: "Your team has a product launch in 3 days. You discover a significant code quality issue that won't cause bugs now but will make future development much harder. Fixing it properly would take 2 days.",
            options: [
              { id: "a", label: "A", text: "Propose a focused fix that addresses the worst parts in half a day", consequence: "Your lead agrees. You fix the critical parts but some tech debt remains.", nextNodeId: "node-a", scores: { productive: 7, balanced: 6, improving: 5 } },
              { id: "b", label: "B", text: "Ship as-is and log a ticket for post-launch", consequence: "Launch goes smoothly on time. The ticket sits in the backlog for months.", nextNodeId: "node-b", scores: { productive: 8, improving: 2 } },
              { id: "c", label: "C", text: "Raise it to the team and let them decide collectively", consequence: "The team discusses it. Some want to delay, others want to ship. It takes an hour to reach consensus.", nextNodeId: "node-c", scores: { empowering: 7, transparent: 8 } },
            ],
          },
          "node-a": {
            id: "node-a",
            text: "Your partial fix is done but you notice it introduced a minor regression in an unrelated feature. Launch is tomorrow.",
            options: [
              { id: "a1", label: "A", text: "Fix the regression and test thoroughly, even if it means staying late", consequence: "Everything works. You're tired but confident in the quality.", scores: { reliable: 8, balanced: 4, improving: 7 } },
              { id: "a2", label: "B", text: "Revert your fix entirely — the original code was working fine", consequence: "Launch proceeds with original code. Your effort was wasted but launch is safe.", scores: { reliable: 6, productive: 5 } },
            ],
          },
          "node-b": {
            id: "node-b",
            text: "Two months later, a new developer struggles with the code you flagged. They ask why it was never fixed.",
            options: [
              { id: "b1", label: "A", text: "Point them to the ticket and say it's in the backlog", consequence: "They're frustrated. The ticket has no priority or timeline.", scores: { transparent: 3, empowering: 2 } },
              { id: "b2", label: "B", text: "Pair with them to fix it now and advocate for prioritizing tech debt", consequence: "You spend a day fixing it together. The new developer learns the codebase.", scores: { empowering: 8, improving: 8, transparent: 6 } },
            ],
          },
          "node-c": {
            id: "node-c",
            text: "The team decides to delay launch by one day to fix the issue. Product management is unhappy about the delay.",
            options: [
              { id: "c1", label: "A", text: "Help explain the technical reasoning to PM in terms they understand", consequence: "PM appreciates the transparency and adjusts messaging to stakeholders.", scores: { transparent: 9, clientFocused: 6 } },
              { id: "c2", label: "B", text: "Let your lead handle the PM conversation — it's above your pay grade", consequence: "Your lead handles it but wishes you'd helped since you found the issue.", scores: { empowering: 2, transparent: 3 } },
            ],
          },
        },
      } as object),
      isPublished: true,
    },
  });

  // --- Stage 3 Scenarios (role-specific) ---
  const engChallenge = await prisma.scenario.create({
    data: {
      title: "Debug the Logic",
      stage: 3,
      type: "role-specific",
      roleType: "engineering",
      tenets: JSON.stringify(["improving", "productive"]),
      scoringRubric: JSON.stringify({
        correctAnswer: "off-by-one",
        approaches: {
          "read-error-msg": { improving: 6, productive: 7 },
          "trace-manually": { improving: 8, productive: 5 },
          "add-logging": { improving: 5, productive: 6 },
        },
      }),
      tree: JSON.stringify({
        type: "debug-challenge",
        problem: "A function is supposed to return the sum of all numbers in an array that are greater than a threshold. For input [1, 5, 3, 8, 2] with threshold 3, it returns 8 instead of 13. Review the code and identify the bug.",
        code: "function sumAbove(nums, threshold) {\n  let sum = 0;\n  for (let i = 1; i < nums.length; i++) {\n    if (nums[i] > threshold) {\n      sum += nums[i];\n    }\n  }\n  return sum;\n}",
        options: [
          { id: "off-by-one", text: "Loop starts at index 1 instead of 0, skipping the first element", correct: true },
          { id: "wrong-operator", text: "Should use >= instead of > for the comparison", correct: false },
          { id: "wrong-var", text: "The sum variable should be initialized to the first element", correct: false },
          { id: "missing-return", text: "The return statement is inside the loop", correct: false },
        ],
        followUp: {
          prompt: "How would you approach fixing this in a real codebase?",
          options: [
            { id: "read-error-msg", text: "Check if there are existing test cases and see which ones fail" },
            { id: "trace-manually", text: "Walk through the code line by line with the example input" },
            { id: "add-logging", text: "Add console.log statements to trace the values at each step" },
          ],
        },
      }),
      isPublished: true,
    },
  });

  const salesChallenge = await prisma.scenario.create({
    data: {
      title: "The Objection Handler",
      stage: 3,
      type: "role-specific",
      roleType: "sales",
      tenets: JSON.stringify(["clientFocused", "improving"]),
      scoringRubric: JSON.stringify({
        pathScores: {
          "root->a->a1": { clientFocused: 9, empowering: 5 },
          "root->a->a2": { clientFocused: 6, transparent: 7 },
          "root->b->b1": { clientFocused: 5, productive: 7 },
          "root->b->b2": { clientFocused: 7, transparent: 8 },
          "root->c->c1": { clientFocused: 8, empowering: 7 },
          "root->c->c2": { clientFocused: 4, productive: 5 },
        },
      }),
      tree: JSON.stringify({
        rootNodeId: "root",
        nodes: {
          root: {
            id: "root",
            text: "You're in a demo with a potential client. They say: 'Your competitor offers the same thing for 30% less. Why should we go with you?'",
            options: [
              { id: "a", label: "A", text: "Ask what specific features they're comparing to understand their needs", consequence: "They mention they need strong customer support and fast onboarding — areas where you excel.", nextNodeId: "node-a", scores: { clientFocused: 8, improving: 5 } },
              { id: "b", label: "B", text: "Highlight your product's unique advantages and ROI data", consequence: "They seem interested but say they need to compare both proposals side by side.", nextNodeId: "node-b", scores: { productive: 6, transparent: 4 } },
              { id: "c", label: "C", text: "Acknowledge the price difference honestly and ask what matters most to them beyond cost", consequence: "They appreciate the honesty and open up about their real priorities: reliability and support.", nextNodeId: "node-c", scores: { transparent: 8, clientFocused: 7 } },
            ],
          },
          "node-a": {
            id: "node-a",
            text: "The client confirms support and onboarding are their top priorities. They ask for references from similar companies.",
            options: [
              { id: "a1", label: "A", text: "Offer to connect them directly with a happy customer in their industry", consequence: "The client is impressed by your confidence and agrees to a follow-up call.", scores: { clientFocused: 9, empowering: 6 } },
              { id: "a2", label: "B", text: "Send a case study and offer a pilot program instead", consequence: "They agree to a pilot. Lower commitment but keeps the deal moving.", scores: { productive: 7, clientFocused: 6 } },
            ],
          },
          "node-b": {
            id: "node-b",
            text: "They come back and say the competitor's proposal looks stronger on paper. They're leaning toward the cheaper option.",
            options: [
              { id: "b1", label: "A", text: "Offer a discount to match closer to the competitor's price", consequence: "They're interested but now question the original pricing.", scores: { productive: 4, transparent: 3 } },
              { id: "b2", label: "B", text: "Ask for a meeting to understand what 'stronger on paper' means specifically", consequence: "You discover gaps in the competitor's proposal. The client reopens the conversation.", scores: { clientFocused: 8, improving: 7 } },
            ],
          },
          "node-c": {
            id: "node-c",
            text: "They share that their last vendor had terrible support and they're scared of repeating that experience.",
            options: [
              { id: "c1", label: "A", text: "Share your support SLAs and offer a trial period with dedicated support", consequence: "They feel heard and agree to start a trial.", scores: { clientFocused: 9, reliable: 8 } },
              { id: "c2", label: "B", text: "Promise premium support as part of the deal", consequence: "They're interested but want it in writing.", scores: { reliable: 5, transparent: 6 } },
            ],
          },
        },
      } as object),
      isPublished: true,
    },
  });

  // --- Link scenarios to roles ---
  // Core scenarios (stage 1 & 2) go to both roles
  const coreScenarios = [prioritySnap, valueMatch, oddOneOut, branchScenario1, branchScenario2];
  for (const scenario of coreScenarios) {
    await prisma.roleScenario.createMany({
      data: [
        { roleId: engRole.id, scenarioId: scenario.id },
        { roleId: salesRole.id, scenarioId: scenario.id },
      ],
    });
  }

  // Role-specific scenarios
  await prisma.roleScenario.create({
    data: { roleId: engRole.id, scenarioId: engChallenge.id },
  });
  await prisma.roleScenario.create({
    data: { roleId: salesRole.id, scenarioId: salesChallenge.id },
  });

  // --- Sample candidate (for testing) ---
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  await prisma.candidate.create({
    data: {
      name: "Test Candidate",
      email: "test@example.com",
      roleId: engRole.id,
      token: "test-token-12345",
      tokenExpiry: expiry,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Add seed config to `package.json`**

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

Also install `tsx`:

```bash
npm install -D tsx
```

- [ ] **Step 3: Run the seed**

```bash
npx prisma db seed
```

Expected: "Seed complete." printed. Database has 2 roles, 7 scenarios, role-scenario links, and 1 test candidate.

- [ ] **Step 4: Verify seed data**

```bash
npx prisma studio
```

Expected: Prisma Studio opens in browser. Verify all tables have data.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed data with sample roles, scenarios, and test candidate"
```

---

## Phase 2: Core Libraries

### Task 4: Token System

**Files:**
- Create: `src/lib/token.ts`
- Test: `__tests__/lib/token.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/token.test.ts`:

```typescript
import { generateToken, validateToken } from "@/lib/token";
import { prisma } from "@/lib/db";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    candidate: {
      findUnique: jest.fn(),
    },
  },
}));

describe("generateToken", () => {
  it("returns a 32-character hex string", () => {
    const token = generateToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()));
    expect(tokens.size).toBe(100);
  });
});

describe("validateToken", () => {
  const mockFindUnique = prisma.candidate.findUnique as jest.Mock;

  afterEach(() => jest.clearAllMocks());

  it("returns candidate when token is valid and not expired", async () => {
    const future = new Date(Date.now() + 86400000);
    const candidate = {
      id: "c1",
      token: "abc",
      tokenExpiry: future,
      status: "invited",
      role: { id: "r1", name: "Engineer" },
      assessment: null,
    };
    mockFindUnique.mockResolvedValue(candidate);

    const result = await validateToken("abc");
    expect(result).toEqual(candidate);
  });

  it("returns null when token not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await validateToken("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when token is expired", async () => {
    const past = new Date(Date.now() - 86400000);
    mockFindUnique.mockResolvedValue({
      id: "c1",
      token: "abc",
      tokenExpiry: past,
      status: "invited",
    });

    const result = await validateToken("abc");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/token.test.ts
```

Expected: FAIL — module `@/lib/token` not found.

- [ ] **Step 3: Implement token module**

Create `src/lib/token.ts`:

```typescript
import crypto from "crypto";
import { prisma } from "./db";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function validateToken(token: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { token },
    include: {
      role: true,
      assessment: true,
    },
  });

  if (!candidate) return null;
  if (new Date() > candidate.tokenExpiry) return null;

  return candidate;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/token.test.ts
```

Expected: All 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/token.ts __tests__/lib/token.test.ts
git commit -m "feat: add token generation and validation"
```

---

### Task 5: Email Service

**Files:**
- Create: `src/lib/email.ts`
- Test: `__tests__/lib/email.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/email.test.ts`:

```typescript
import { buildInviteEmail, buildCompletionEmail, buildResultsReadyEmail } from "@/lib/email";

describe("buildInviteEmail", () => {
  it("includes candidate name and assessment link", () => {
    const result = buildInviteEmail({
      candidateName: "Alice",
      roleName: "Frontend Engineer",
      token: "abc123",
      baseUrl: "http://localhost:3000",
    });

    expect(result.subject).toContain("Nymbl");
    expect(result.html).toContain("Alice");
    expect(result.html).toContain("Frontend Engineer");
    expect(result.html).toContain("http://localhost:3000/assess/abc123");
  });
});

describe("buildCompletionEmail", () => {
  it("includes candidate name and thank you message", () => {
    const result = buildCompletionEmail({
      candidateName: "Alice",
      roleName: "Frontend Engineer",
    });

    expect(result.subject).toContain("Nymbl Ascent");
    expect(result.html).toContain("Alice");
    expect(result.html).not.toContain("score"); // no score revealed
  });
});

describe("buildResultsReadyEmail", () => {
  it("includes role name and dashboard link", () => {
    const result = buildResultsReadyEmail({
      roleName: "Frontend Engineer",
      candidateName: "Alice",
      baseUrl: "http://localhost:3000",
      candidateId: "c1",
    });

    expect(result.subject).toContain("Results");
    expect(result.html).toContain("Frontend Engineer");
    expect(result.html).toContain("http://localhost:3000/admin/results/c1");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/email.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement email module**

Create `src/lib/email.ts`:

```typescript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface EmailContent {
  subject: string;
  html: string;
}

export function buildInviteEmail(params: {
  candidateName: string;
  roleName: string;
  token: string;
  baseUrl: string;
}): EmailContent {
  const link = `${params.baseUrl}/assess/${params.token}`;
  return {
    subject: `You're invited to Nymbl Ascent — ${params.roleName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Nymbl Ascent</h1>
        <p>Hi ${params.candidateName},</p>
        <p>Thanks for applying to the <strong>${params.roleName}</strong> role at Nymbl!</p>
        <p>We'd love to get to know you better through a short interactive assessment. It takes about 10–15 minutes and consists of three stages.</p>
        <a href="${link}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Start Your Assessment</a>
        <p style="color: #666; font-size: 14px;">This link expires in 7 days. You can pause and resume at any time.</p>
      </div>
    `,
  };
}

export function buildCompletionEmail(params: {
  candidateName: string;
  roleName: string;
}): EmailContent {
  return {
    subject: "Thanks for completing Nymbl Ascent!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Nymbl Ascent</h1>
        <p>Hi ${params.candidateName},</p>
        <p>Thank you for completing the assessment for the <strong>${params.roleName}</strong> role. We appreciate the time you invested.</p>
        <p>Our team will review your results and be in touch soon.</p>
        <p>Best,<br/>The Nymbl Team</p>
      </div>
    `,
  };
}

export function buildResultsReadyEmail(params: {
  roleName: string;
  candidateName: string;
  baseUrl: string;
  candidateId: string;
}): EmailContent {
  const link = `${params.baseUrl}/admin/results/${params.candidateId}`;
  return {
    subject: `Results Ready: ${params.candidateName} — ${params.roleName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">New Assessment Results</h1>
        <p>Assessment results are ready for <strong>${params.candidateName}</strong> applying to <strong>${params.roleName}</strong>.</p>
        <a href="${link}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">View Results</a>
      </div>
    `,
  };
}

export async function sendEmail(to: string, content: EmailContent): Promise<void> {
  await transporter.sendMail({
    from: `"Nymbl Ascent" <${process.env.GMAIL_USER}>`,
    to,
    subject: content.subject,
    html: content.html,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/email.test.ts
```

Expected: All 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email.ts __tests__/lib/email.test.ts
git commit -m "feat: add email templates and Gmail SMTP transport"
```

---

### Task 6: Scoring Engine

**Files:**
- Create: `src/lib/scoring.ts`
- Test: `__tests__/lib/scoring.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/scoring.test.ts`:

```typescript
import {
  computeStage1Scores,
  computeStage2Scores,
  computeBehavioralScore,
  computeCompositeScore,
} from "@/lib/scoring";
import type { Stage1Result, Stage2Result, Tenet } from "@/types";

describe("computeStage1Scores", () => {
  it("scores Priority Snap based on order accuracy and time", () => {
    const stage1: Stage1Result = {
      prioritySnap: {
        order: ["client-issue", "team-blocker", "own-deadline", "nice-to-have", "admin-task"],
        timeMs: 12000,
        revisions: 1,
      },
      valueMatch: {
        matches: [
          { valueId: "client-focused", situationId: "situation-client", correct: true },
          { valueId: "transparent", situationId: "situation-transparent", correct: true },
          { valueId: "empowering", situationId: "situation-empowering", correct: true },
          { valueId: "reliable", situationId: "situation-reliable", correct: true },
        ],
        timeMs: 20000,
      },
      oddOneOut: {
        picks: [
          { roundId: "r1", chosenId: "r1-c", correct: true },
          { roundId: "r2", chosenId: "r2-b", correct: true },
          { roundId: "r3", chosenId: "r3-d", correct: true },
        ],
        timeMs: 15000,
      },
      signals: [],
    };

    const scores = computeStage1Scores(stage1);
    expect(scores.productive).toBeGreaterThan(70);
    expect(scores.balanced).toBeGreaterThan(70);
    expect(scores.clientFocused).toBeGreaterThan(70);
    expect(scores.transparent).toBeGreaterThan(70);
    expect(scores.reliable).toBeGreaterThan(70);
    expect(scores.improving).toBeGreaterThan(70);
  });

  it("scores lower for incorrect answers", () => {
    const perfect: Stage1Result = {
      prioritySnap: { order: ["client-issue", "team-blocker", "own-deadline", "nice-to-have", "admin-task"], timeMs: 12000, revisions: 1 },
      valueMatch: { matches: [
        { valueId: "client-focused", situationId: "situation-client", correct: true },
        { valueId: "transparent", situationId: "situation-transparent", correct: true },
        { valueId: "empowering", situationId: "situation-empowering", correct: true },
        { valueId: "reliable", situationId: "situation-reliable", correct: true },
      ], timeMs: 20000 },
      oddOneOut: { picks: [
        { roundId: "r1", chosenId: "r1-c", correct: true },
        { roundId: "r2", chosenId: "r2-b", correct: true },
        { roundId: "r3", chosenId: "r3-d", correct: true },
      ], timeMs: 15000 },
      signals: [],
    };

    const wrong: Stage1Result = {
      prioritySnap: { order: ["admin-task", "nice-to-have", "own-deadline", "team-blocker", "client-issue"], timeMs: 50000, revisions: 0 },
      valueMatch: { matches: [
        { valueId: "client-focused", situationId: "situation-transparent", correct: false },
        { valueId: "transparent", situationId: "situation-client", correct: false },
        { valueId: "empowering", situationId: "situation-reliable", correct: false },
        { valueId: "reliable", situationId: "situation-empowering", correct: false },
      ], timeMs: 50000 },
      oddOneOut: { picks: [
        { roundId: "r1", chosenId: "r1-a", correct: false },
        { roundId: "r2", chosenId: "r2-a", correct: false },
        { roundId: "r3", chosenId: "r3-a", correct: false },
      ], timeMs: 50000 },
      signals: [],
    };

    const perfectScores = computeStage1Scores(perfect);
    const wrongScores = computeStage1Scores(wrong);

    expect(perfectScores.productive).toBeGreaterThan(wrongScores.productive);
    expect(perfectScores.clientFocused).toBeGreaterThan(wrongScores.clientFocused);
    expect(perfectScores.reliable).toBeGreaterThan(wrongScores.reliable);
  });
});

describe("computeStage2Scores", () => {
  it("computes scores from decision path using scoring rubric", () => {
    const rubric = {
      pathScores: {
        "root->d->d1": { clientFocused: 9, reliable: 8, transparent: 6 },
      },
    };

    const stage2: Stage2Result = {
      scenarios: [
        {
          scenarioId: "s1",
          path: [
            { nodeId: "root", choiceId: "d", timeMs: 5000 },
            { nodeId: "node-d", choiceId: "d1", timeMs: 4000 },
          ],
        },
      ],
      signals: [],
    };

    const scores = computeStage2Scores(stage2, [{ scenarioId: "s1", rubric }]);
    expect(scores.clientFocused).toBeGreaterThan(0);
    expect(scores.reliable).toBeGreaterThan(0);
  });
});

describe("computeBehavioralScore", () => {
  it("penalizes extremely fast responses", () => {
    const fast = computeBehavioralScore([
      { event: "choice_made", timestamp: 200, data: {} },
      { event: "choice_made", timestamp: 400, data: {} },
      { event: "choice_made", timestamp: 600, data: {} },
    ]);

    const normal = computeBehavioralScore([
      { event: "choice_made", timestamp: 3000, data: {} },
      { event: "choice_made", timestamp: 7000, data: {} },
      { event: "choice_made", timestamp: 12000, data: {} },
    ]);

    expect(normal).toBeGreaterThan(fast);
  });
});

describe("computeCompositeScore", () => {
  it("weights correctly: 60% core, 25% role fit, 15% behavioral", () => {
    const tenets: Record<Tenet, number> = {
      clientFocused: 80, empowering: 80, productive: 80,
      balanced: 80, reliable: 80, improving: 80, transparent: 80,
    };
    const composite = computeCompositeScore(tenets, 90, 70);

    // 80 * 0.6 + 90 * 0.25 + 70 * 0.15 = 48 + 22.5 + 10.5 = 81
    expect(composite).toBeCloseTo(81, 0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/scoring.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement scoring engine**

Create `src/lib/scoring.ts`:

```typescript
import type { Tenet, Stage1Result, Stage2Result, BehavioralSignal } from "@/types";

type TenetScores = Record<Tenet, number>;

function emptyScores(): TenetScores {
  return {
    clientFocused: 0, empowering: 0, productive: 0,
    balanced: 0, reliable: 0, improving: 0, transparent: 0,
  };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// Kendall tau distance: how many pairs are out of order
function orderAccuracy(actual: string[], ideal: string[]): number {
  let concordant = 0;
  let total = 0;
  for (let i = 0; i < actual.length; i++) {
    for (let j = i + 1; j < actual.length; j++) {
      total++;
      const aI = ideal.indexOf(actual[i]);
      const aJ = ideal.indexOf(actual[j]);
      if (aI < aJ) concordant++;
    }
  }
  return total === 0 ? 0 : concordant / total;
}

function timeBonus(timeMs: number, fastMs: number, slowMs: number): number {
  if (timeMs <= fastMs) return 10;
  if (timeMs >= slowMs) return 0;
  return 10 * (1 - (timeMs - fastMs) / (slowMs - fastMs));
}

export function computeStage1Scores(data: Stage1Result): TenetScores {
  const scores = emptyScores();

  // Priority Snap → Productive, Balanced
  const idealOrder = ["client-issue", "team-blocker", "own-deadline", "nice-to-have", "admin-task"];
  const snapAccuracy = orderAccuracy(data.prioritySnap.order, idealOrder);
  const snapTime = timeBonus(data.prioritySnap.timeMs, 10000, 60000);
  scores.productive = clamp(snapAccuracy * 80 + snapTime + (data.prioritySnap.revisions > 0 ? 5 : 0));
  scores.balanced = clamp(snapAccuracy * 75 + snapTime);

  // Value Match → Client Focused, Transparent
  const matchCorrect = data.valueMatch.matches.filter((m) => m.correct).length;
  const matchTotal = data.valueMatch.matches.length;
  const matchPct = matchTotal > 0 ? matchCorrect / matchTotal : 0;
  const matchTime = timeBonus(data.valueMatch.timeMs, 15000, 60000);
  scores.clientFocused = clamp(matchPct * 80 + matchTime);
  scores.transparent = clamp(matchPct * 80 + matchTime);

  // Odd One Out → Reliable, Improving
  const oddCorrect = data.oddOneOut.picks.filter((p) => p.correct).length;
  const oddTotal = data.oddOneOut.picks.length;
  const oddPct = oddTotal > 0 ? oddCorrect / oddTotal : 0;
  const oddTime = timeBonus(data.oddOneOut.timeMs, 10000, 60000);
  scores.reliable = clamp(oddPct * 80 + oddTime);
  scores.improving = clamp(oddPct * 80 + oddTime);

  return scores;
}

export function computeStage2Scores(
  data: Stage2Result,
  scenarioRubrics: { scenarioId: string; rubric: { pathScores: Record<string, Partial<TenetScores>> } }[]
): TenetScores {
  const scores = emptyScores();
  let scenarioCount = 0;

  for (const played of data.scenarios) {
    const rubricEntry = scenarioRubrics.find((r) => r.scenarioId === played.scenarioId);
    if (!rubricEntry) continue;

    // Build path key from choices
    const pathKey = played.path.map((p) => p.choiceId).join("->");
    // Try exact match first, then prefix matches
    const pathScores = rubricEntry.rubric.pathScores;
    let matched = pathScores[pathKey];

    if (!matched) {
      // Try with root prefix
      const withRoot = "root->" + pathKey;
      matched = pathScores[withRoot];
    }

    if (!matched) {
      // Accumulate scores from individual choice scores in the scenario tree
      // Fallback: average the available path scores
      const allPaths = Object.values(pathScores);
      if (allPaths.length > 0) {
        const avg = emptyScores();
        for (const ps of allPaths) {
          for (const [k, v] of Object.entries(ps)) {
            avg[k as Tenet] += (v || 0) / allPaths.length;
          }
        }
        matched = avg;
      }
    }

    if (matched) {
      scenarioCount++;
      for (const [tenet, value] of Object.entries(matched)) {
        // Normalize scenario scores (0-10) to 0-100 scale
        scores[tenet as Tenet] += ((value || 0) / 10) * 100;
      }
    }
  }

  // Average across scenarios
  if (scenarioCount > 0) {
    for (const tenet of Object.keys(scores) as Tenet[]) {
      scores[tenet] = clamp(scores[tenet] / scenarioCount);
    }
  }

  return scores;
}

export function computeBehavioralScore(signals: BehavioralSignal[]): number {
  if (signals.length === 0) return 50; // neutral

  let score = 70; // start at baseline

  // Analyze decision speed
  const choiceEvents = signals.filter((s) => s.event === "choice_made");
  if (choiceEvents.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < choiceEvents.length; i++) {
      gaps.push(choiceEvents[i].timestamp - choiceEvents[i - 1].timestamp);
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

    // Penalize if average gap < 1 second (likely random clicking)
    if (avgGap < 1000) score -= 30;
    // Slight penalty for very fast (< 2s)
    else if (avgGap < 2000) score -= 10;
    // Bonus for thoughtful pace (2-10s)
    else if (avgGap <= 10000) score += 15;
    // Slight penalty for very slow (> 30s, may indicate distraction)
    else if (avgGap > 30000) score -= 5;
  }

  // Bonus for revisions (shows thoughtfulness, up to 3)
  const revisions = signals.filter((s) => s.event === "revision");
  score += Math.min(revisions.length, 3) * 5;

  return clamp(score);
}

export function computeCompositeScore(
  tenets: TenetScores,
  roleFitScore: number,
  behavioralScore: number
): number {
  const tenetAvg =
    Object.values(tenets).reduce((sum, v) => sum + v, 0) / 7;
  return tenetAvg * 0.6 + roleFitScore * 0.25 + behavioralScore * 0.15;
}

export function mergeScores(a: TenetScores, b: TenetScores, weightA = 0.5, weightB = 0.5): TenetScores {
  const result = emptyScores();
  for (const tenet of Object.keys(result) as Tenet[]) {
    result[tenet] = a[tenet] * weightA + b[tenet] * weightB;
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/scoring.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts __tests__/lib/scoring.test.ts
git commit -m "feat: add scoring engine for tenets, behavioral signals, and composite"
```

---

### Task 7: AI Scoring Integration

**Files:**
- Create: `src/lib/ai-scoring.ts`
- Test: `__tests__/lib/ai-scoring.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/ai-scoring.test.ts`:

```typescript
import { buildScoringPrompt, parseAiScoreResponse } from "@/lib/ai-scoring";

describe("buildScoringPrompt", () => {
  it("includes tenet names and decision paths in the prompt", () => {
    const prompt = buildScoringPrompt({
      candidateName: "Alice",
      roleName: "Engineer",
      decisionPaths: [
        {
          scenarioTitle: "Client Escalation",
          choices: ["Handled client directly", "Asked for extension"],
        },
      ],
    });

    expect(prompt).toContain("Client Focused");
    expect(prompt).toContain("Empowering");
    expect(prompt).toContain("Client Escalation");
    expect(prompt).toContain("Handled client directly");
  });
});

describe("parseAiScoreResponse", () => {
  it("parses JSON scores from AI response", () => {
    const response = JSON.stringify({
      tenets: {
        clientFocused: 85,
        empowering: 60,
        productive: 70,
        balanced: 75,
        reliable: 80,
        improving: 65,
        transparent: 90,
      },
      analysis: "Candidate shows strong client focus and transparency.",
    });

    const result = parseAiScoreResponse(response);
    expect(result.tenets.clientFocused).toBe(85);
    expect(result.analysis).toContain("client focus");
  });

  it("returns null for invalid JSON", () => {
    const result = parseAiScoreResponse("not json");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/ai-scoring.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement AI scoring module**

Create `src/lib/ai-scoring.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { Tenet } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type TenetScores = Record<Tenet, number>;

interface ScoringInput {
  candidateName: string;
  roleName: string;
  decisionPaths: {
    scenarioTitle: string;
    choices: string[];
  }[];
}

interface AiScoreResult {
  tenets: TenetScores;
  analysis: string;
}

export function buildScoringPrompt(input: ScoringInput): string {
  const pathDescriptions = input.decisionPaths
    .map(
      (p) =>
        `Scenario: "${p.scenarioTitle}"\nDecisions: ${p.choices.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
    )
    .join("\n\n");

  return `You are evaluating a job candidate for the "${input.roleName}" role at Nymbl.

Nymbl's 7 tenets are:
- Client Focused: Prioritizes customer needs and satisfaction
- Empowering: Enables others, delegates, collaborates
- Productive: Efficient, action-oriented, delivers results
- Balanced: Manages trade-offs, avoids extremes
- Reliable: Consistent, follows through, trustworthy
- Improving: Growth mindset, learns from mistakes, adapts
- Transparent: Honest, communicates openly, surfaces issues

The candidate made these decisions in workplace scenarios:

${pathDescriptions}

Score the candidate 0-100 on each tenet based on their decision patterns. Provide a brief qualitative analysis.

Respond with ONLY valid JSON in this exact format:
{
  "tenets": {
    "clientFocused": <number>,
    "empowering": <number>,
    "productive": <number>,
    "balanced": <number>,
    "reliable": <number>,
    "improving": <number>,
    "transparent": <number>
  },
  "analysis": "<2-3 sentence qualitative summary>"
}`;
}

export function parseAiScoreResponse(response: string): AiScoreResult | null {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.tenets || !parsed.analysis) return null;

    return {
      tenets: parsed.tenets,
      analysis: parsed.analysis,
    };
  } catch {
    return null;
  }
}

export async function scoreWithAi(input: ScoringInput): Promise<AiScoreResult | null> {
  const prompt = buildScoringPrompt(input);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return parseAiScoreResponse(text);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/lib/ai-scoring.test.ts
```

Expected: All tests pass. (Tests only cover prompt building and parsing, not the actual API call.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai-scoring.ts __tests__/lib/ai-scoring.test.ts
git commit -m "feat: add Claude API integration for AI-powered scoring"
```

---

### Task 8: AI Scenario Generation

**Files:**
- Create: `src/lib/ai-generate.ts`

- [ ] **Step 1: Implement scenario generation module**

Create `src/lib/ai-generate.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { ScenarioTree, Tenet } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface GenerateInput {
  targetTenets: Tenet[];
  roleType: string;
  stage: number;
}

export async function generateScenario(input: GenerateInput): Promise<{
  title: string;
  tree: ScenarioTree;
  tenets: Tenet[];
} | null> {
  const tenetList = input.targetTenets.join(", ");

  const prompt = `Generate a workplace scenario for a "${input.roleType}" role that evaluates these Nymbl tenets: ${tenetList}.

This is for Stage ${input.stage} of a candidate screening assessment.

${input.stage === 2 ? `Create a branching scenario with:
- An initial situation with 3-4 response options
- Each option leads to a consequence and a follow-up decision (2 options each)
- No option should be obviously "correct" — they should reveal values and priorities
- Each option should have tenet scores (-10 to +10)` : ""}

${input.stage === 1 ? `Create a mini-game scenario appropriate for quick, gamified interaction (drag-and-drop, matching, or multiple choice).` : ""}

${input.stage === 3 ? `Create a role-specific challenge that tests both the tenets and practical skills for a "${input.roleType}" role.` : ""}

Respond with ONLY valid JSON in this format:
{
  "title": "<scenario title>",
  "tree": {
    "rootNodeId": "root",
    "nodes": {
      "root": {
        "id": "root",
        "text": "<situation description>",
        "options": [
          {
            "id": "<option-id>",
            "label": "A",
            "text": "<option text>",
            "consequence": "<what happens>",
            "nextNodeId": "<next-node-id or null>",
            "scores": { "<tenet>": <number> }
          }
        ]
      }
    }
  }
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title,
      tree: parsed.tree,
      tenets: input.targetTenets,
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai-generate.ts
git commit -m "feat: add AI scenario generation via Claude API"
```

---

## Phase 3: API Routes

### Task 9: Assessment API Routes

**Files:**
- Create: `src/app/api/assess/validate/route.ts`, `src/app/api/assess/progress/route.ts`, `src/app/api/assess/submit/route.ts`

- [ ] **Step 1: Token validation endpoint**

Create `src/app/api/assess/validate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/token";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const candidate = await validateToken(token);
  if (!candidate) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  return NextResponse.json({
    candidateId: candidate.id,
    name: candidate.name,
    roleName: candidate.role.name,
    status: candidate.status,
    currentStage: candidate.assessment?.currentStage ?? 0,
  });
}
```

- [ ] **Step 2: Progress save/load endpoint**

Create `src/app/api/assess/progress/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateToken } from "@/lib/token";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const candidate = await validateToken(token);
  if (!candidate) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const assessment = candidate.assessment;
  return NextResponse.json({
    currentStage: assessment?.currentStage ?? 0,
    stage1Data: assessment?.stage1Data ? JSON.parse(assessment.stage1Data) : null,
    stage2Data: assessment?.stage2Data ? JSON.parse(assessment.stage2Data) : null,
    stage3Data: assessment?.stage3Data ? JSON.parse(assessment.stage3Data) : null,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, stage, data } = body;

  if (!token || !stage) {
    return NextResponse.json({ error: "Token and stage required" }, { status: 400 });
  }

  const candidate = await validateToken(token);
  if (!candidate) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  if (candidate.status === "completed" || candidate.status === "scored") {
    return NextResponse.json({ error: "Assessment already completed" }, { status: 400 });
  }

  const stageField = `stage${stage}Data` as "stage1Data" | "stage2Data" | "stage3Data";

  const assessment = await prisma.assessment.upsert({
    where: { candidateId: candidate.id },
    create: {
      candidateId: candidate.id,
      currentStage: stage,
      [stageField]: JSON.stringify(data),
    },
    update: {
      currentStage: stage,
      [stageField]: JSON.stringify(data),
    },
  });

  // Update candidate status
  if (candidate.status === "invited") {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { status: "in_progress" },
    });
  }

  return NextResponse.json({ ok: true, currentStage: assessment.currentStage });
}
```

- [ ] **Step 3: Final submission endpoint**

Create `src/app/api/assess/submit/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateToken } from "@/lib/token";

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  const candidate = await validateToken(token);
  if (!candidate) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  if (candidate.status === "completed" || candidate.status === "scored") {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  // Mark assessment as complete
  await prisma.assessment.update({
    where: { candidateId: candidate.id },
    data: { completedAt: new Date(), currentStage: 3 },
  });

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: { status: "completed" },
  });

  // Trigger async scoring (fire and forget — scoring endpoint handles the work)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  fetch(`${baseUrl}/api/scoring`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId: candidate.id }),
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/assess/
git commit -m "feat: add assessment API routes for validate, progress, and submit"
```

---

### Task 10: Scoring API Route

**Files:**
- Create: `src/app/api/scoring/route.ts`

- [ ] **Step 1: Implement scoring endpoint**

Create `src/app/api/scoring/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeStage1Scores, computeStage2Scores, computeBehavioralScore, computeCompositeScore, mergeScores } from "@/lib/scoring";
import { scoreWithAi } from "@/lib/ai-scoring";
import { sendEmail, buildCompletionEmail, buildResultsReadyEmail } from "@/lib/email";
import type { Stage1Result, Stage2Result, Stage3Result, Tenet } from "@/types";

export async function POST(request: NextRequest) {
  const { candidateId } = await request.json();

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { assessment: true, role: true },
  });

  if (!candidate?.assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const assessment = candidate.assessment;
  const stage1: Stage1Result | null = assessment.stage1Data ? JSON.parse(assessment.stage1Data) : null;
  const stage2: Stage2Result | null = assessment.stage2Data ? JSON.parse(assessment.stage2Data) : null;
  const stage3: Stage3Result | null = assessment.stage3Data ? JSON.parse(assessment.stage3Data) : null;

  // Compute rule-based scores
  const stage1Scores = stage1 ? computeStage1Scores(stage1) : null;

  // Get scenario rubrics for stage 2
  let stage2Scores = null;
  if (stage2) {
    const scenarioIds = stage2.scenarios.map((s) => s.scenarioId);
    const scenarios = await prisma.scenario.findMany({
      where: { id: { in: scenarioIds } },
    });
    const rubrics = scenarios.map((s) => ({
      scenarioId: s.id,
      rubric: JSON.parse(s.scoringRubric),
    }));
    stage2Scores = computeStage2Scores(stage2, rubrics);
  }

  // AI scoring for qualitative analysis
  let aiResult = null;
  if (stage2) {
    const scenarios = await prisma.scenario.findMany({
      where: { id: { in: stage2.scenarios.map((s) => s.scenarioId) } },
    });
    const decisionPaths = stage2.scenarios.map((played) => {
      const scenario = scenarios.find((s) => s.id === played.scenarioId);
      const tree = scenario ? JSON.parse(scenario.tree) : null;
      const choices = played.path.map((p) => {
        if (!tree?.nodes?.[p.nodeId]) return p.choiceId;
        const node = tree.nodes[p.nodeId];
        const option = node.options?.find((o: { id: string }) => o.id === p.choiceId);
        return option?.text || p.choiceId;
      });
      return { scenarioTitle: scenario?.title || "Unknown", choices };
    });

    aiResult = await scoreWithAi({
      candidateName: candidate.name,
      roleName: candidate.role.name,
      decisionPaths,
    });
  }

  // Merge all tenet scores (rule-based weighted 60%, AI weighted 40%)
  const emptyTenets: Record<Tenet, number> = {
    clientFocused: 50, empowering: 50, productive: 50,
    balanced: 50, reliable: 50, improving: 50, transparent: 50,
  };
  let finalTenets = emptyTenets;
  if (stage1Scores && stage2Scores) {
    finalTenets = mergeScores(stage1Scores, stage2Scores, 0.4, 0.6);
  } else if (stage1Scores) {
    finalTenets = stage1Scores;
  } else if (stage2Scores) {
    finalTenets = stage2Scores;
  }

  // Blend in AI scores if available
  if (aiResult) {
    finalTenets = mergeScores(finalTenets, aiResult.tenets, 0.6, 0.4);
  }

  // Behavioral score from all signals
  const allSignals = [
    ...(stage1?.signals || []),
    ...(stage2?.signals || []),
    ...(stage3?.signals || []),
  ];
  const behavioralScore = computeBehavioralScore(allSignals);

  // Role fit score (stage 3 — simplified: average of improving + role-specific performance)
  // Stage 3 role fit: score based on correctness + approach quality
  let roleFitScore = 50; // default if no stage 3 data
  if (stage3) {
    const s3 = stage3 as { challengeType: string; responses: Record<string, unknown> };
    if (s3.challengeType === "debug") {
      const resp = s3.responses as { debugAnswer?: string; followUpAnswer?: string };
      // Correct bug identification = 60 points, good approach = 30 points, time bonus = 10
      roleFitScore = (resp.debugAnswer === "off-by-one" ? 60 : 20)
        + (resp.followUpAnswer === "trace-manually" ? 30 : resp.followUpAnswer === "read-error-msg" ? 25 : 20)
        + (stage3.timeMs < 180000 ? 10 : 5);
      roleFitScore = Math.min(100, roleFitScore);
    } else if (s3.challengeType === "branching") {
      // Score branching role challenges the same way as Stage 2 scenarios
      roleFitScore = 70; // baseline for completing the branching challenge
    }
  }

  const compositeScore = computeCompositeScore(finalTenets, roleFitScore, behavioralScore);

  // Save scores
  await prisma.score.upsert({
    where: { assessmentId: assessment.id },
    create: {
      assessmentId: assessment.id,
      ...finalTenets,
      roleFitScore,
      behavioralScore,
      compositeScore,
      breakdown: JSON.stringify({ stage1Scores, stage2Scores, aiScores: aiResult?.tenets }),
      aiAnalysis: aiResult?.analysis || null,
    },
    update: {
      ...finalTenets,
      roleFitScore,
      behavioralScore,
      compositeScore,
      breakdown: JSON.stringify({ stage1Scores, stage2Scores, aiScores: aiResult?.tenets }),
      aiAnalysis: aiResult?.analysis || null,
    },
  });

  // Update candidate status
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: "scored" },
  });

  // Send emails
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    await sendEmail(
      candidate.email,
      buildCompletionEmail({ candidateName: candidate.name, roleName: candidate.role.name })
    );
    // Results ready email — in MVP, send to GMAIL_USER as the hiring team contact
    if (process.env.GMAIL_USER) {
      await sendEmail(
        process.env.GMAIL_USER,
        buildResultsReadyEmail({
          roleName: candidate.role.name,
          candidateName: candidate.name,
          baseUrl,
          candidateId: candidate.id,
        })
      );
    }
  } catch (emailErr) {
    console.error("Email send failed:", emailErr);
  }

  return NextResponse.json({ ok: true, compositeScore });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/scoring/route.ts
git commit -m "feat: add scoring API that merges rule-based, AI, and behavioral scores"
```

---

### Task 11: Admin API Routes

**Files:**
- Create: `src/app/api/admin/roles/route.ts`, `src/app/api/admin/scenarios/route.ts`, `src/app/api/admin/scenarios/[id]/route.ts`, `src/app/api/admin/candidates/route.ts`, `src/app/api/admin/candidates/invite/route.ts`, `src/app/api/admin/results/route.ts`, `src/app/api/ai/generate/route.ts`

- [ ] **Step 1: Roles CRUD endpoint**

Create `src/app/api/admin/roles/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const roles = await prisma.role.findMany({
    include: { _count: { select: { candidates: true, roleScenarios: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(roles);
}

export async function POST(request: NextRequest) {
  const { name, description, corePoolSize } = await request.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const role = await prisma.role.create({
    data: { name, description: description || "", corePoolSize: corePoolSize || 2 },
  });
  return NextResponse.json(role, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { id, name, description, corePoolSize } = await request.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const role = await prisma.role.update({
    where: { id },
    data: { name, description, corePoolSize },
  });
  return NextResponse.json(role);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  await prisma.role.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Scenarios CRUD endpoint**

Create `src/app/api/admin/scenarios/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const stage = request.nextUrl.searchParams.get("stage");
  const type = request.nextUrl.searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (stage) where.stage = parseInt(stage);
  if (type) where.type = type;

  const scenarios = await prisma.scenario.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    scenarios.map((s) => ({
      ...s,
      tree: JSON.parse(s.tree),
      tenets: JSON.parse(s.tenets),
      scoringRubric: JSON.parse(s.scoringRubric),
    }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const scenario = await prisma.scenario.create({
    data: {
      title: body.title,
      stage: body.stage,
      type: body.type,
      roleType: body.roleType || null,
      tree: JSON.stringify(body.tree),
      tenets: JSON.stringify(body.tenets),
      scoringRubric: JSON.stringify(body.scoringRubric || {}),
      isPublished: body.isPublished || false,
    },
  });
  return NextResponse.json(scenario, { status: 201 });
}
```

- [ ] **Step 3: Single scenario endpoint**

Create `src/app/api/admin/scenarios/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = await prisma.scenario.findUnique({ where: { id } });
  if (!scenario) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...scenario,
    tree: JSON.parse(scenario.tree),
    tenets: JSON.parse(scenario.tenets),
    scoringRubric: JSON.parse(scenario.scoringRubric),
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const scenario = await prisma.scenario.update({
    where: { id },
    data: {
      title: body.title,
      stage: body.stage,
      type: body.type,
      roleType: body.roleType,
      tree: JSON.stringify(body.tree),
      tenets: JSON.stringify(body.tenets),
      scoringRubric: JSON.stringify(body.scoringRubric),
      isPublished: body.isPublished,
    },
  });
  return NextResponse.json(scenario);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.scenario.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Candidates endpoint**

Create `src/app/api/admin/candidates/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const roleId = request.nextUrl.searchParams.get("roleId");
  const status = request.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (roleId) where.roleId = roleId;
  if (status) where.status = status;

  const candidates = await prisma.candidate.findMany({
    where,
    include: {
      role: true,
      assessment: { include: { score: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(candidates);
}
```

- [ ] **Step 5: Invite endpoint**

Create `src/app/api/admin/candidates/invite/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/token";
import { sendEmail, buildInviteEmail } from "@/lib/email";

interface InvitePayload {
  candidates: { name: string; email: string }[];
  roleId: string;
}

export async function POST(request: NextRequest) {
  const { candidates: candidateList, roleId }: InvitePayload = await request.json();

  if (!candidateList?.length || !roleId) {
    return NextResponse.json({ error: "Candidates and roleId required" }, { status: 400 });
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  const results = [];

  for (const c of candidateList) {
    const token = generateToken();

    const candidate = await prisma.candidate.create({
      data: {
        name: c.name,
        email: c.email,
        roleId,
        token,
        tokenExpiry: expiry,
      },
    });

    try {
      await sendEmail(
        c.email,
        buildInviteEmail({
          candidateName: c.name,
          roleName: role.name,
          token,
          baseUrl,
        })
      );
      results.push({ name: c.name, email: c.email, status: "sent" });
    } catch (err) {
      console.error(`Failed to send invite to ${c.email}:`, err);
      results.push({ name: c.name, email: c.email, status: "failed" });
    }
  }

  return NextResponse.json({ results }, { status: 201 });
}
```

- [ ] **Step 6: Results endpoint**

Create `src/app/api/admin/results/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const roleId = request.nextUrl.searchParams.get("roleId");

  const where: Record<string, unknown> = { status: { in: ["completed", "scored"] } };
  if (roleId) where.roleId = roleId;

  const candidates = await prisma.candidate.findMany({
    where,
    include: {
      role: true,
      assessment: { include: { score: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Sort by composite score (scored candidates first)
  const sorted = candidates.sort((a, b) => {
    const scoreA = a.assessment?.score?.compositeScore ?? -1;
    const scoreB = b.assessment?.score?.compositeScore ?? -1;
    return scoreB - scoreA;
  });

  return NextResponse.json(sorted);
}
```

- [ ] **Step 7: AI scenario generation endpoint**

Create `src/app/api/ai/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { generateScenario } from "@/lib/ai-generate";

export async function POST(request: NextRequest) {
  const { targetTenets, roleType, stage } = await request.json();

  if (!targetTenets?.length || !roleType || !stage) {
    return NextResponse.json({ error: "targetTenets, roleType, and stage required" }, { status: 400 });
  }

  const result = await generateScenario({ targetTenets, roleType, stage });
  if (!result) {
    return NextResponse.json({ error: "Failed to generate scenario" }, { status: 500 });
  }

  return NextResponse.json(result);
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/api/admin/ src/app/api/ai/
git commit -m "feat: add admin API routes for roles, scenarios, candidates, results, and AI generation"
```

---

## Phase 4: Candidate-Facing UI

### Task 12: UI Components — Shared

**Files:**
- Create: `src/components/ui/ProgressBar.tsx`, `src/components/ui/Timer.tsx`, `src/components/ui/StageTransition.tsx`

- [ ] **Step 1: ProgressBar component**

Create `src/components/ui/ProgressBar.tsx`:

```tsx
"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Timer component**

Create `src/components/ui/Timer.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  durationMs: number;
  onExpire?: () => void;
  className?: string;
}

export function Timer({ durationMs, onExpire, className }: TimerProps) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [durationMs, onExpire]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isLow = remaining < 30000;

  return (
    <span className={`font-mono text-lg ${isLow ? "text-red-500 animate-pulse" : "text-gray-700"} ${className || ""}`}>
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}
```

- [ ] **Step 3: StageTransition component**

Create `src/components/ui/StageTransition.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface StageTransitionProps {
  message: string;
  subMessage?: string;
  onComplete: () => void;
  durationMs?: number;
}

export function StageTransition({ message, subMessage, onComplete, durationMs = 3000 }: StageTransitionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(onComplete, durationMs);
    return () => clearTimeout(timer);
  }, [onComplete, durationMs]);

  return (
    <div className={`fixed inset-0 bg-indigo-600 flex flex-col items-center justify-center transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}>
      <h1 className="text-4xl font-bold text-white mb-4">{message}</h1>
      {subMessage && <p className="text-xl text-indigo-200">{subMessage}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shared UI components — ProgressBar, Timer, StageTransition"
```

---

### Task 13: Stage 1 — Mini-Game Components

**Files:**
- Create: `src/components/games/PrioritySnap.tsx`, `src/components/games/ValueMatch.tsx`, `src/components/games/OddOneOut.tsx`
- Test: `__tests__/components/PrioritySnap.test.tsx`

- [ ] **Step 1: Write PrioritySnap failing test**

Create `__tests__/components/PrioritySnap.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { PrioritySnap } from "@/components/games/PrioritySnap";

const mockItems = [
  { id: "a", label: "Task A", weight: 5 },
  { id: "b", label: "Task B", weight: 3 },
  { id: "c", label: "Task C", weight: 1 },
];

describe("PrioritySnap", () => {
  it("renders all items", () => {
    render(<PrioritySnap items={mockItems} onComplete={jest.fn()} />);
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Task B")).toBeInTheDocument();
    expect(screen.getByText("Task C")).toBeInTheDocument();
  });

  it("shows instruction text", () => {
    render(<PrioritySnap items={mockItems} onComplete={jest.fn()} />);
    expect(screen.getByText(/drag/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/PrioritySnap.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement PrioritySnap**

Create `src/components/games/PrioritySnap.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";

interface Item {
  id: string;
  label: string;
  weight: number;
}

interface PrioritySnapProps {
  items: Item[];
  onComplete: (result: { order: string[]; timeMs: number; revisions: number }) => void;
}

export function PrioritySnap({ items, onComplete }: PrioritySnapProps) {
  const [orderedItems, setOrderedItems] = useState(() =>
    [...items].sort(() => Math.random() - 0.5)
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [revisions, setRevisions] = useState(0);
  const startTime = useRef(Date.now());

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newItems = [...orderedItems];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, moved);
    setOrderedItems(newItems);
    setDragIndex(index);
    setRevisions((r) => r + 1);
  }

  function handleSubmit() {
    onComplete({
      order: orderedItems.map((item) => item.id),
      timeMs: Date.now() - startTime.current,
      revisions,
    });
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-2">Priority Snap</h2>
      <p className="text-gray-600 mb-6">Drag these tasks into priority order — highest priority at the top.</p>

      <div className="space-y-2 mb-6">
        {orderedItems.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            className={`flex items-center gap-3 p-4 bg-white rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${
              dragIndex === index ? "border-indigo-400 shadow-lg" : "border-gray-200"
            }`}
          >
            <span className="text-gray-400 font-mono text-sm w-6">{index + 1}.</span>
            <span className="flex-1 font-medium">{item.label}</span>
            <span className="text-gray-300">⠿</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
      >
        Lock In Order
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Implement ValueMatch**

Create `src/components/games/ValueMatch.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";

interface Value {
  id: string;
  label: string;
}

interface Situation {
  id: string;
  text: string;
}

interface ValueMatchProps {
  values: Value[];
  situations: Situation[];
  correctMatches: Record<string, string>;
  onComplete: (result: {
    matches: { valueId: string; situationId: string; correct: boolean }[];
    timeMs: number;
  }) => void;
}

export function ValueMatch({ values, situations, correctMatches, onComplete }: ValueMatchProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [matchedSituations, setMatchedSituations] = useState<Set<string>>(new Set());
  const startTime = useRef(Date.now());

  function handleValueClick(valueId: string) {
    if (matches[valueId]) return; // already matched
    setSelectedValue(valueId);
  }

  function handleSituationClick(situationId: string) {
    if (!selectedValue || matchedSituations.has(situationId)) return;

    setMatches((prev) => ({ ...prev, [selectedValue]: situationId }));
    setMatchedSituations((prev) => new Set(prev).add(situationId));
    setSelectedValue(null);

    // Check if all matched
    const newMatches = { ...matches, [selectedValue]: situationId };
    if (Object.keys(newMatches).length === values.length) {
      setTimeout(() => {
        onComplete({
          matches: Object.entries(newMatches).map(([valueId, situationId]) => ({
            valueId,
            situationId,
            correct: correctMatches[valueId] === situationId,
          })),
          timeMs: Date.now() - startTime.current,
        });
      }, 300);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Value Match</h2>
      <p className="text-gray-600 mb-6">Match each Nymbl value to the workplace situation that best represents it.</p>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-500 text-sm uppercase">Values</h3>
          {values.map((v) => (
            <button
              key={v.id}
              onClick={() => handleValueClick(v.id)}
              disabled={!!matches[v.id]}
              className={`w-full p-3 rounded-lg text-left font-medium transition ${
                matches[v.id]
                  ? "bg-green-100 text-green-800 border-2 border-green-300"
                  : selectedValue === v.id
                  ? "bg-indigo-100 text-indigo-800 border-2 border-indigo-400"
                  : "bg-white border-2 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-500 text-sm uppercase">Situations</h3>
          {situations.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSituationClick(s.id)}
              disabled={matchedSituations.has(s.id)}
              className={`w-full p-3 rounded-lg text-left text-sm transition ${
                matchedSituations.has(s.id)
                  ? "bg-green-100 text-green-800 border-2 border-green-300"
                  : selectedValue
                  ? "bg-white border-2 border-gray-200 hover:border-indigo-300 cursor-pointer"
                  : "bg-white border-2 border-gray-200 opacity-60"
              }`}
            >
              {s.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement OddOneOut**

Create `src/components/games/OddOneOut.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";

interface OddOption {
  id: string;
  text: string;
}

interface OddRound {
  id: string;
  prompt: string;
  options: OddOption[];
}

interface OddOneOutProps {
  rounds: OddRound[];
  onComplete: (result: {
    picks: { roundId: string; chosenId: string; correct: boolean }[];
    timeMs: number;
  }) => void;
  correctAnswers: Record<string, string>;
}

export function OddOneOut({ rounds, onComplete, correctAnswers }: OddOneOutProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [picks, setPicks] = useState<{ roundId: string; chosenId: string; correct: boolean }[]>([]);
  const startTime = useRef(Date.now());

  function handlePick(optionId: string) {
    const round = rounds[currentRound];
    const correct = correctAnswers[round.id] === optionId;
    const newPicks = [...picks, { roundId: round.id, chosenId: optionId, correct }];
    setPicks(newPicks);

    if (currentRound + 1 < rounds.length) {
      setCurrentRound(currentRound + 1);
    } else {
      onComplete({
        picks: newPicks,
        timeMs: Date.now() - startTime.current,
      });
    }
  }

  const round = rounds[currentRound];

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-2">Odd One Out</h2>
      <p className="text-gray-600 mb-1">Round {currentRound + 1} of {rounds.length}</p>
      <p className="text-lg font-medium mb-6">{round.prompt}</p>

      <div className="space-y-3">
        {round.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handlePick(opt.id)}
            className="w-full p-4 bg-white rounded-lg border-2 border-gray-200 text-left hover:border-indigo-400 hover:bg-indigo-50 transition"
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run PrioritySnap test**

```bash
npx jest __tests__/components/PrioritySnap.test.tsx
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/games/ __tests__/components/
git commit -m "feat: add Stage 1 mini-game components — PrioritySnap, ValueMatch, OddOneOut"
```

---

### Task 14: Stage 2 — Branching Scenario Component

**Files:**
- Create: `src/components/scenarios/BranchingScenario.tsx`
- Test: `__tests__/components/BranchingScenario.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/BranchingScenario.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { BranchingScenario } from "@/components/scenarios/BranchingScenario";

const mockTree = {
  rootNodeId: "root",
  nodes: {
    root: {
      id: "root",
      text: "A problem occurs. What do you do?",
      options: [
        { id: "a", label: "A", text: "Act immediately", consequence: "You resolved it fast.", scores: {} },
        { id: "b", label: "B", text: "Wait and see", consequence: "It got worse.", nextNodeId: "node-b", scores: {} },
      ],
    },
    "node-b": {
      id: "node-b",
      text: "It got worse. Now what?",
      options: [
        { id: "b1", label: "A", text: "Fix it now", consequence: "Better late than never.", scores: {} },
      ],
    },
  },
};

describe("BranchingScenario", () => {
  it("renders the root scenario text", () => {
    render(<BranchingScenario tree={mockTree} onComplete={jest.fn()} />);
    expect(screen.getByText("A problem occurs. What do you do?")).toBeInTheDocument();
  });

  it("shows options as clickable buttons", () => {
    render(<BranchingScenario tree={mockTree} onComplete={jest.fn()} />);
    expect(screen.getByText("Act immediately")).toBeInTheDocument();
    expect(screen.getByText("Wait and see")).toBeInTheDocument();
  });

  it("advances to consequence after choosing", () => {
    render(<BranchingScenario tree={mockTree} onComplete={jest.fn()} />);
    fireEvent.click(screen.getByText("Wait and see"));
    expect(screen.getByText("It got worse.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/BranchingScenario.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement BranchingScenario**

Create `src/components/scenarios/BranchingScenario.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";
import type { ScenarioTree, ScenarioOption } from "@/types";

interface BranchingScenarioProps {
  tree: ScenarioTree;
  onComplete: (path: { nodeId: string; choiceId: string; timeMs: number }[]) => void;
}

type Phase = "question" | "consequence";

export function BranchingScenario({ tree, onComplete }: BranchingScenarioProps) {
  const [currentNodeId, setCurrentNodeId] = useState(tree.rootNodeId);
  const [phase, setPhase] = useState<Phase>("question");
  const [selectedOption, setSelectedOption] = useState<ScenarioOption | null>(null);
  const [path, setPath] = useState<{ nodeId: string; choiceId: string; timeMs: number }[]>([]);
  const nodeStartTime = useRef(Date.now());

  const currentNode = tree.nodes[currentNodeId];

  function handleChoice(option: ScenarioOption) {
    const elapsed = Date.now() - nodeStartTime.current;
    const newPath = [...path, { nodeId: currentNodeId, choiceId: option.id, timeMs: elapsed }];
    setPath(newPath);
    setSelectedOption(option);
    setPhase("consequence");
  }

  function handleContinue() {
    if (!selectedOption) return;

    if (selectedOption.nextNodeId && tree.nodes[selectedOption.nextNodeId]) {
      setCurrentNodeId(selectedOption.nextNodeId);
      setPhase("question");
      setSelectedOption(null);
      nodeStartTime.current = Date.now();
    } else {
      // No more nodes — scenario complete
      onComplete(path);
    }
  }

  if (!currentNode) {
    onComplete(path);
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {phase === "question" && (
        <>
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
            <p className="text-lg leading-relaxed">{currentNode.text}</p>
          </div>

          <div className="space-y-3">
            {currentNode.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => handleChoice(option)}
                className="w-full p-4 bg-white rounded-lg border-2 border-gray-200 text-left hover:border-indigo-400 hover:bg-indigo-50 transition"
              >
                <span className="inline-block w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-center leading-8 font-bold mr-3">
                  {option.label}
                </span>
                <span>{option.text}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "consequence" && selectedOption && (
        <>
          <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200 mb-6">
            <p className="text-sm font-semibold text-amber-700 mb-2">What happened:</p>
            <p className="text-lg leading-relaxed">{selectedOption.consequence}</p>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            {selectedOption.nextNodeId ? "Continue" : "Finish Scenario"}
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test**

```bash
npx jest __tests__/components/BranchingScenario.test.tsx
```

Expected: All 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/scenarios/ __tests__/components/BranchingScenario.test.tsx
git commit -m "feat: add BranchingScenario component with multi-layer decision tree"
```

---

### Task 15: Candidate Assessment Pages

**Files:**
- Create: `src/app/assess/[token]/page.tsx`, `src/app/assess/[token]/stage1/page.tsx`, `src/app/assess/[token]/stage2/page.tsx`, `src/app/assess/[token]/stage3/page.tsx`, `src/app/assess/[token]/complete/page.tsx`

- [ ] **Step 1: Welcome page**

Create `src/app/assess/[token]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface CandidateInfo {
  candidateId: string;
  name: string;
  roleName: string;
  status: string;
  currentStage: number;
}

export default function WelcomePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [info, setInfo] = useState<CandidateInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/assess/validate?token=${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Invalid or expired link");
        return r.json();
      })
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Link Invalid</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (info.status === "completed" || info.status === "scored") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Already Completed</h1>
          <p className="text-gray-600">You've already completed this assessment. Thank you!</p>
        </div>
      </div>
    );
  }

  // Resume if in progress
  const resumeStage = info.currentStage > 0 ? info.currentStage : 1;

  function handleStart() {
    router.push(`/assess/${token}/stage${resumeStage}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-lg text-center p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Nymbl Ascent</h1>
        <p className="text-xl text-gray-600 mb-8">
          Welcome, {info.name}! You're applying for <strong>{info.roleName}</strong>.
        </p>

        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8 text-left">
          <h2 className="font-semibold text-gray-900 mb-3">What to expect:</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">1.</span>
              <span><strong>Learn</strong> — Quick, fun warm-up games (~3 min)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">2.</span>
              <span><strong>Build</strong> — Interactive workplace scenarios (~5 min)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">3.</span>
              <span><strong>Grow</strong> — A challenge tailored to your role (~5 min)</span>
            </li>
          </ul>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Total time: ~10–15 minutes. You can pause and resume anytime.
        </p>

        <button
          onClick={handleStart}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition"
        >
          {info.currentStage > 0 ? "Resume Assessment" : "Begin Assessment"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Stage 1 page**

Create `src/app/assess/[token]/stage1/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PrioritySnap } from "@/components/games/PrioritySnap";
import { ValueMatch } from "@/components/games/ValueMatch";
import { OddOneOut } from "@/components/games/OddOneOut";
import { StageTransition } from "@/components/ui/StageTransition";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Timer } from "@/components/ui/Timer";
import type { Stage1Result, BehavioralSignal } from "@/types";

type Game = "priority-snap" | "value-match" | "odd-one-out" | "done";

export default function Stage1Page() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [currentGame, setCurrentGame] = useState<Game>("priority-snap");
  const [showTransition, setShowTransition] = useState(false);
  const [signals] = useState<BehavioralSignal[]>([]);
  const [result, setResult] = useState<Partial<Stage1Result>>({});
  const [scenarios, setScenarios] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/admin/scenarios?stage=1&type=core")
      .then((r) => r.json())
      .then((data) => {
        const scenarioMap: Record<string, unknown> = {};
        for (const s of data) {
          const tree = typeof s.tree === "string" ? JSON.parse(s.tree) : s.tree;
          scenarioMap[tree.type] = tree;
        }
        setScenarios(scenarioMap);
      });
  }, []);

  const saveProgress = useCallback(async (data: Partial<Stage1Result>) => {
    await fetch("/api/assess/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, stage: 1, data }),
    });
  }, [token]);

  function handlePriorityComplete(data: Stage1Result["prioritySnap"]) {
    const updated = { ...result, prioritySnap: data, signals };
    setResult(updated);
    saveProgress(updated);
    setCurrentGame("value-match");
  }

  function handleValueMatchComplete(data: Stage1Result["valueMatch"]) {
    const updated = { ...result, valueMatch: data, signals };
    setResult(updated);
    saveProgress(updated);
    setCurrentGame("odd-one-out");
  }

  function handleOddOneOutComplete(data: Stage1Result["oddOneOut"]) {
    const finalResult = { ...result, oddOneOut: data, signals };
    setResult(finalResult);
    saveProgress(finalResult);
    setCurrentGame("done");
    setShowTransition(true);
  }

  if (!scenarios) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  if (showTransition) {
    return (
      <StageTransition
        message="Nice work!"
        subMessage="Now let's build."
        onComplete={() => router.push(`/assess/${token}/stage2`)}
      />
    );
  }

  const gameIndex = currentGame === "priority-snap" ? 1 : currentGame === "value-match" ? 2 : 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-sm font-semibold text-indigo-600 uppercase">Stage 1 — Learn</h1>
            <ProgressBar current={gameIndex} total={3} />
          </div>
          <Timer durationMs={180000} />
        </div>

        {currentGame === "priority-snap" && (
          <PrioritySnap
            items={(scenarios["priority-snap"] as { items: { id: string; label: string; weight: number }[] }).items}
            onComplete={handlePriorityComplete}
          />
        )}

        {currentGame === "value-match" && (
          <ValueMatch
            values={(scenarios["value-match"] as { values: { id: string; label: string }[] }).values}
            situations={(scenarios["value-match"] as { situations: { id: string; text: string }[] }).situations}
            correctMatches={(scenarios["value-match"] as { correctMatches: Record<string, string> }).correctMatches || {}}
            onComplete={handleValueMatchComplete}
          />
        )}

        {currentGame === "odd-one-out" && (
          <OddOneOut
            rounds={(scenarios["odd-one-out"] as { rounds: { id: string; prompt: string; options: { id: string; text: string }[] }[] }).rounds}
            correctAnswers={{ r1: "r1-c", r2: "r2-b", r3: "r3-d" }}
            onComplete={handleOddOneOutComplete}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Stage 2 page**

Create `src/app/assess/[token]/stage2/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { BranchingScenario } from "@/components/scenarios/BranchingScenario";
import { StageTransition } from "@/components/ui/StageTransition";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Timer } from "@/components/ui/Timer";
import type { ScenarioTree, Stage2Result, BehavioralSignal } from "@/types";

interface ScenarioData {
  id: string;
  title: string;
  tree: ScenarioTree;
}

export default function Stage2Page() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [scenarios, setScenarios] = useState<ScenarioData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedPaths, setCompletedPaths] = useState<Stage2Result["scenarios"]>([]);
  const [signals] = useState<BehavioralSignal[]>([]);
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    fetch("/api/admin/scenarios?stage=2&type=core")
      .then((r) => r.json())
      .then((data: ScenarioData[]) => {
        // Randomly pick 2 scenarios
        const shuffled = data.filter((s) => s.tree?.rootNodeId).sort(() => Math.random() - 0.5);
        setScenarios(shuffled.slice(0, 2));
      });
  }, []);

  const saveProgress = useCallback(async (paths: Stage2Result["scenarios"]) => {
    await fetch("/api/assess/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, stage: 2, data: { scenarios: paths, signals } }),
    });
  }, [token, signals]);

  function handleScenarioComplete(path: { nodeId: string; choiceId: string; timeMs: number }[]) {
    const scenario = scenarios[currentIndex];
    const newPaths = [...completedPaths, { scenarioId: scenario.id, path }];
    setCompletedPaths(newPaths);
    saveProgress(newPaths);

    if (currentIndex + 1 < scenarios.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowTransition(true);
    }
  }

  if (scenarios.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading scenarios...</p></div>;
  }

  if (showTransition) {
    return (
      <StageTransition
        message="One more stage"
        subMessage="Show us how you grow."
        onComplete={() => router.push(`/assess/${token}/stage3`)}
      />
    );
  }

  const currentScenario = scenarios[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-sm font-semibold text-amber-600 uppercase">Stage 2 — Build</h1>
            <p className="text-gray-600 text-sm">Scenario {currentIndex + 1} of {scenarios.length}</p>
            <ProgressBar current={currentIndex + 1} total={scenarios.length} />
          </div>
          <Timer durationMs={300000} />
        </div>

        <h2 className="text-xl font-bold mb-4">{currentScenario.title}</h2>
        <BranchingScenario
          key={currentScenario.id}
          tree={currentScenario.tree}
          onComplete={handleScenarioComplete}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Stage 3 page**

Create `src/app/assess/[token]/stage3/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { BranchingScenario } from "@/components/scenarios/BranchingScenario";
import { Timer } from "@/components/ui/Timer";
import type { ScenarioTree, BehavioralSignal } from "@/types";

interface ChallengeData {
  id: string;
  title: string;
  tree: ScenarioTree | { type: string; problem: string; code: string; options: { id: string; text: string; correct: boolean }[]; followUp: { prompt: string; options: { id: string; text: string }[] } };
}

export default function Stage3Page() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [signals] = useState<BehavioralSignal[]>([]);
  const [debugAnswer, setDebugAnswer] = useState<string | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null);

  useEffect(() => {
    // Get candidate's role to fetch role-specific scenarios
    fetch(`/api/assess/validate?token=${token}`)
      .then((r) => r.json())
      .then(async (info) => {
        const res = await fetch(`/api/admin/scenarios?stage=3&type=role-specific`);
        const scenarios = await res.json();
        // Pick one randomly
        if (scenarios.length > 0) {
          const shuffled = scenarios.sort(() => Math.random() - 0.5);
          setChallenge(shuffled[0]);
        }
      });
  }, [token]);

  const saveAndSubmit = useCallback(async (data: Record<string, unknown>) => {
    await fetch("/api/assess/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, stage: 3, data: { ...data, signals } }),
    });
    await fetch("/api/assess/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    router.push(`/assess/${token}/complete`);
  }, [token, signals, router]);

  if (!challenge) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading challenge...</p></div>;
  }

  const tree = challenge.tree;

  // Debug challenge type
  if ("type" in tree && tree.type === "debug-challenge") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-sm font-semibold text-green-600 uppercase">Stage 3 — Grow</h1>
            <Timer durationMs={300000} />
          </div>

          <h2 className="text-xl font-bold mb-4">{challenge.title}</h2>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
            <p className="mb-4">{tree.problem}</p>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{tree.code}</code>
            </pre>
          </div>

          {!debugAnswer && (
            <div className="space-y-3">
              <p className="font-medium">What's the bug?</p>
              {tree.options.map((opt: { id: string; text: string }) => (
                <button
                  key={opt.id}
                  onClick={() => setDebugAnswer(opt.id)}
                  className="w-full p-4 bg-white rounded-lg border-2 border-gray-200 text-left hover:border-green-400 hover:bg-green-50 transition"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          {debugAnswer && !followUpAnswer && (
            <div className="space-y-3">
              <p className="font-medium">{tree.followUp.prompt}</p>
              {tree.followUp.options.map((opt: { id: string; text: string }) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setFollowUpAnswer(opt.id);
                    saveAndSubmit({
                      challengeType: "debug",
                      responses: { debugAnswer, followUpAnswer: opt.id },
                      timeMs: 0,
                    });
                  }}
                  className="w-full p-4 bg-white rounded-lg border-2 border-gray-200 text-left hover:border-green-400 hover:bg-green-50 transition"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Branching scenario type (e.g., sales)
  if ("rootNodeId" in tree) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-sm font-semibold text-green-600 uppercase">Stage 3 — Grow</h1>
            <Timer durationMs={300000} />
          </div>
          <h2 className="text-xl font-bold mb-4">{challenge.title}</h2>
          <BranchingScenario
            tree={tree as ScenarioTree}
            onComplete={(path) => {
              saveAndSubmit({
                challengeType: "branching",
                responses: { scenarioId: challenge.id, path },
                timeMs: 0,
              });
            }}
          />
        </div>
      </div>
    );
  }

  return <div>Unknown challenge type</div>;
}
```

- [ ] **Step 5: Completion page**

Create `src/app/assess/[token]/complete/page.tsx`:

```tsx
export default function CompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-lg text-center p-8">
        <div className="text-6xl mb-6">&#10003;</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thanks for completing Nymbl Ascent!</h1>
        <p className="text-gray-600 mb-2">Your responses have been submitted.</p>
        <p className="text-gray-500">Our team will review your results and be in touch soon.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/assess/
git commit -m "feat: add candidate assessment pages — welcome, stage 1-3, and completion"
```

---

## Phase 5: Admin Panel UI

### Task 16: Admin Layout & Dashboard

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`

- [ ] **Step 1: Admin layout with sidebar**

Create `src/app/admin/layout.tsx`:

```tsx
import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/scenarios", label: "Scenarios" },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/results", label: "Results" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white p-6">
        <h1 className="text-xl font-bold mb-8">Nymbl Ascent</h1>
        <p className="text-gray-400 text-xs mb-6 uppercase">Admin Panel</p>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Dashboard overview page**

Create `src/app/admin/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalRoles: number;
  totalCandidates: number;
  pendingScoring: number;
  completedToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/roles").then((r) => r.json()),
      fetch("/api/admin/candidates").then((r) => r.json()),
    ]).then(([roles, candidates]) => {
      const today = new Date().toDateString();
      setStats({
        totalRoles: roles.length,
        totalCandidates: candidates.length,
        pendingScoring: candidates.filter((c: { status: string }) => c.status === "completed").length,
        completedToday: candidates.filter(
          (c: { status: string; updatedAt: string }) =>
            (c.status === "completed" || c.status === "scored") &&
            new Date(c.updatedAt).toDateString() === today
        ).length,
      });
    });
  }, []);

  if (!stats) return <p>Loading...</p>;

  const cards = [
    { label: "Roles", value: stats.totalRoles },
    { label: "Total Candidates", value: stats.totalCandidates },
    { label: "Pending Scoring", value: stats.pendingScoring },
    { label: "Completed Today", value: stats.completedToday },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/page.tsx
git commit -m "feat: add admin layout with sidebar and dashboard overview"
```

---

### Task 17: Admin — Role Manager Page

**Files:**
- Create: `src/app/admin/roles/page.tsx`

- [ ] **Step 1: Implement roles page**

Create `src/app/admin/roles/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface Role {
  id: string;
  name: string;
  description: string;
  corePoolSize: number;
  _count: { candidates: number; roleScenarios: number };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", corePoolSize: 2 });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadRoles() {
    const res = await fetch("/api/admin/roles");
    setRoles(await res.json());
  }

  useEffect(() => { loadRoles(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...formData, id: editingId } : formData;

    await fetch("/api/admin/roles", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setFormData({ name: "", description: "", corePoolSize: 2 });
    setEditingId(null);
    setShowForm(false);
    loadRoles();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this role?")) return;
    await fetch("/api/admin/roles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadRoles();
  }

  function handleEdit(role: Role) {
    setFormData({ name: role.name, description: role.description, corePoolSize: role.corePoolSize });
    setEditingId(role.id);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Roles</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          {showForm ? "Cancel" : "Add Role"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 mb-6 space-y-4">
          <input type="text" placeholder="Role name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full p-3 border rounded-lg" />
          <input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 border rounded-lg" />
          <input type="number" placeholder="Core pool size" value={formData.corePoolSize} onChange={(e) => setFormData({ ...formData, corePoolSize: parseInt(e.target.value) })} min={1} className="w-32 p-3 border rounded-lg" />
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
            {editingId ? "Update" : "Create"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{role.name}</h3>
              <p className="text-sm text-gray-500">{role.description}</p>
              <p className="text-xs text-gray-400">{role._count.candidates} candidates | {role._count.roleScenarios} scenarios | Pool size: {role.corePoolSize}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(role)} className="text-indigo-600 hover:underline text-sm">Edit</button>
              <button onClick={() => handleDelete(role.id)} className="text-red-600 hover:underline text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/roles/
git commit -m "feat: add admin role manager page with CRUD"
```

---

### Task 18: Admin — Scenarios Page

**Files:**
- Create: `src/app/admin/scenarios/page.tsx`, `src/app/admin/scenarios/[id]/page.tsx`

- [ ] **Step 1: Scenarios list page**

Create `src/app/admin/scenarios/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Tenet } from "@/types";
import { TENET_LABELS } from "@/types";

interface ScenarioItem {
  id: string;
  title: string;
  stage: number;
  type: string;
  roleType: string | null;
  tenets: Tenet[];
  isPublished: boolean;
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [filterStage, setFilterStage] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  async function loadScenarios() {
    const url = filterStage ? `/api/admin/scenarios?stage=${filterStage}` : "/api/admin/scenarios";
    const res = await fetch(url);
    setScenarios(await res.json());
  }

  useEffect(() => { loadScenarios(); }, [filterStage]);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetTenets: ["clientFocused", "reliable"],
        roleType: "general",
        stage: 2,
      }),
    });
    const generated = await res.json();
    if (generated.title) {
      await fetch("/api/admin/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...generated,
          stage: 2,
          type: "core",
          scoringRubric: {},
          isPublished: false,
        }),
      });
      loadScenarios();
    }
    setGenerating(false);
  }

  const stageLabels: Record<number, string> = { 1: "Learn", 2: "Build", 3: "Grow" };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Scenarios</h1>
        <button onClick={handleGenerate} disabled={generating} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">
          {generating ? "Generating..." : "AI Generate Scenario"}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilterStage(null)} className={`px-3 py-1 rounded-full text-sm ${!filterStage ? "bg-indigo-600 text-white" : "bg-gray-200"}`}>All</button>
        {[1, 2, 3].map((s) => (
          <button key={s} onClick={() => setFilterStage(s)} className={`px-3 py-1 rounded-full text-sm ${filterStage === s ? "bg-indigo-600 text-white" : "bg-gray-200"}`}>
            Stage {s}: {stageLabels[s]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {scenarios.map((s) => (
          <Link key={s.id} href={`/admin/scenarios/${s.id}`} className="block bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-300 transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-gray-500">
                  Stage {s.stage} ({stageLabels[s.stage]}) | {s.type}{s.roleType ? ` (${s.roleType})` : ""}
                </p>
                <div className="flex gap-1 mt-2">
                  {s.tenets.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                      {TENET_LABELS[t] || t}
                    </span>
                  ))}
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${s.isPublished ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {s.isPublished ? "Published" : "Draft"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Scenario editor page**

Create `src/app/admin/scenarios/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ScenarioDetail {
  id: string;
  title: string;
  stage: number;
  type: string;
  roleType: string | null;
  tree: Record<string, unknown>;
  tenets: string[];
  scoringRubric: Record<string, unknown>;
  isPublished: boolean;
}

export default function ScenarioEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [title, setTitle] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [treeJson, setTreeJson] = useState("");
  const [rubricJson, setRubricJson] = useState("");

  useEffect(() => {
    fetch(`/api/admin/scenarios/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setScenario(data);
        setTitle(data.title);
        setIsPublished(data.isPublished);
        setTreeJson(JSON.stringify(data.tree, null, 2));
        setRubricJson(JSON.stringify(data.scoringRubric, null, 2));
      });
  }, [id]);

  async function handleSave() {
    try {
      const tree = JSON.parse(treeJson);
      const scoringRubric = JSON.parse(rubricJson);

      await fetch(`/api/admin/scenarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...scenario, title, tree, scoringRubric, isPublished }),
      });
      router.push("/admin/scenarios");
    } catch {
      alert("Invalid JSON in tree or rubric");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this scenario?")) return;
    await fetch(`/api/admin/scenarios/${id}`, { method: "DELETE" });
    router.push("/admin/scenarios");
  }

  if (!scenario) return <p>Loading...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Scenario</h1>
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save</button>
          <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-lg" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} id="published" />
          <label htmlFor="published" className="text-sm">Published</label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Branching Tree (JSON)</label>
          <textarea value={treeJson} onChange={(e) => setTreeJson(e.target.value)} rows={20} className="w-full p-3 border rounded-lg font-mono text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Scoring Rubric (JSON)</label>
          <textarea value={rubricJson} onChange={(e) => setRubricJson(e.target.value)} rows={10} className="w-full p-3 border rounded-lg font-mono text-sm" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/scenarios/
git commit -m "feat: add admin scenario list, editor, and AI generation"
```

---

### Task 19: Admin — Candidates Page

**Files:**
- Create: `src/app/admin/candidates/page.tsx`, `src/components/admin/CsvUpload.tsx`

- [ ] **Step 1: CSV upload component**

Create `src/components/admin/CsvUpload.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";

interface CsvCandidate {
  name: string;
  email: string;
}

interface CsvUploadProps {
  onParsed: (candidates: CsvCandidate[]) => void;
}

export function CsvUpload({ onParsed }: CsvUploadProps) {
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);

      if (lines.length < 2) {
        setError("CSV must have a header row and at least one data row");
        return;
      }

      const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
      const nameIdx = header.indexOf("name");
      const emailIdx = header.indexOf("email");

      if (nameIdx === -1 || emailIdx === -1) {
        setError("CSV must have 'name' and 'email' columns");
        return;
      }

      const candidates: CsvCandidate[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols[nameIdx] && cols[emailIdx]) {
          candidates.push({ name: cols[nameIdx], email: cols[emailIdx] });
        }
      }

      if (candidates.length === 0) {
        setError("No valid candidates found in CSV");
        return;
      }

      onParsed(candidates);
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      <button onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-full text-center text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition">
        Upload CSV (name, email)
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Candidates page**

Create `src/app/admin/candidates/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { CsvUpload } from "@/components/admin/CsvUpload";

interface Role {
  id: string;
  name: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  role: { name: string };
  assessment: { score: { compositeScore: number } | null } | null;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [sending, setSending] = useState(false);

  async function loadCandidates() {
    const url = selectedRole ? `/api/admin/candidates?roleId=${selectedRole}` : "/api/admin/candidates";
    const res = await fetch(url);
    setCandidates(await res.json());
  }

  useEffect(() => { loadCandidates(); }, [selectedRole]);
  useEffect(() => {
    fetch("/api/admin/roles").then((r) => r.json()).then(setRoles);
  }, []);

  async function sendInvites(list: { name: string; email: string }[], roleId: string) {
    setSending(true);
    await fetch("/api/admin/candidates/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates: list, roleId }),
    });
    setSending(false);
    setShowInvite(false);
    setInviteName("");
    setInviteEmail("");
    loadCandidates();
  }

  const statusColors: Record<string, string> = {
    invited: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    completed: "bg-orange-100 text-orange-700",
    scored: "bg-green-100 text-green-700",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Candidates</h1>
        <button onClick={() => setShowInvite(!showInvite)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          {showInvite ? "Cancel" : "Invite Candidates"}
        </button>
      </div>

      {showInvite && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 space-y-4">
          <select value={inviteRoleId} onChange={(e) => setInviteRoleId(e.target.value)} required className="w-full p-3 border rounded-lg">
            <option value="">Select role...</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="p-3 border rounded-lg" />
            <input type="email" placeholder="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="p-3 border rounded-lg" />
          </div>
          <button disabled={!inviteName || !inviteEmail || !inviteRoleId || sending} onClick={() => sendInvites([{ name: inviteName, email: inviteEmail }], inviteRoleId)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg disabled:opacity-50">
            {sending ? "Sending..." : "Send Invite"}
          </button>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">Or bulk invite via CSV:</p>
            <CsvUpload onParsed={(list) => {
              if (inviteRoleId) sendInvites(list, inviteRoleId);
              else alert("Select a role first");
            }} />
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="p-2 border rounded-lg text-sm">
          <option value="">All roles</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Name</th>
              <th className="text-left p-3 text-sm font-semibold">Email</th>
              <th className="text-left p-3 text-sm font-semibold">Role</th>
              <th className="text-left p-3 text-sm font-semibold">Status</th>
              <th className="text-left p-3 text-sm font-semibold">Score</th>
              <th className="text-left p-3 text-sm font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.name}</td>
                <td className="p-3 text-gray-500">{c.email}</td>
                <td className="p-3">{c.role.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[c.status] || ""}`}>{c.status}</span>
                </td>
                <td className="p-3 font-mono">{c.assessment?.score?.compositeScore?.toFixed(1) ?? "—"}</td>
                <td className="p-3 text-gray-500 text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/candidates/ src/components/admin/CsvUpload.tsx
git commit -m "feat: add admin candidate manager with single invite and CSV bulk upload"
```

---

### Task 20: Admin — Results Dashboard

**Files:**
- Create: `src/app/admin/results/page.tsx`, `src/app/admin/results/[id]/page.tsx`, `src/components/admin/RadarChart.tsx`

- [ ] **Step 1: Radar chart component**

Create `src/components/admin/RadarChart.tsx`:

```tsx
"use client";

import { TENET_LABELS, type Tenet } from "@/types";

interface RadarChartProps {
  scores: Record<Tenet, number>;
  size?: number;
}

export function RadarChart({ scores, size = 300 }: RadarChartProps) {
  const tenets = Object.keys(TENET_LABELS) as Tenet[];
  const center = size / 2;
  const radius = size / 2 - 40;
  const angleStep = (2 * Math.PI) / tenets.length;

  function polarToCartesian(angle: number, r: number) {
    return {
      x: center + r * Math.cos(angle - Math.PI / 2),
      y: center + r * Math.sin(angle - Math.PI / 2),
    };
  }

  // Grid rings
  const rings = [20, 40, 60, 80, 100];
  const gridPaths = rings.map((ring) => {
    const points = tenets.map((_, i) => {
      const p = polarToCartesian(i * angleStep, (ring / 100) * radius);
      return `${p.x},${p.y}`;
    });
    return `M${points.join("L")}Z`;
  });

  // Data polygon
  const dataPoints = tenets.map((t, i) => {
    const val = Math.max(0, Math.min(100, scores[t] || 0));
    return polarToCartesian(i * angleStep, (val / 100) * radius);
  });
  const dataPath = `M${dataPoints.map((p) => `${p.x},${p.y}`).join("L")}Z`;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {/* Grid */}
      {gridPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      ))}

      {/* Axis lines */}
      {tenets.map((_, i) => {
        const end = polarToCartesian(i * angleStep, radius);
        return <line key={i} x1={center} y1={center} x2={end.x} y2={end.y} stroke="#e5e7eb" strokeWidth="1" />;
      })}

      {/* Data polygon */}
      <path d={dataPath} fill="rgba(79, 70, 229, 0.2)" stroke="#4f46e5" strokeWidth="2" />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#4f46e5" />
      ))}

      {/* Labels */}
      {tenets.map((t, i) => {
        const labelPos = polarToCartesian(i * angleStep, radius + 20);
        return (
          <text key={t} x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" className="text-xs fill-gray-600">
            {TENET_LABELS[t]}
          </text>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Results list page**

Create `src/app/admin/results/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Role { id: string; name: string; }

interface ResultCandidate {
  id: string;
  name: string;
  email: string;
  status: string;
  role: { name: string };
  assessment: {
    score: {
      compositeScore: number;
      clientFocused: number;
      empowering: number;
      productive: number;
      balanced: number;
      reliable: number;
      improving: number;
      transparent: number;
    } | null;
  } | null;
}

export default function ResultsPage() {
  const [candidates, setCandidates] = useState<ResultCandidate[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [sortBy, setSortBy] = useState("compositeScore");

  useEffect(() => {
    fetch("/api/admin/roles").then((r) => r.json()).then(setRoles);
  }, []);

  useEffect(() => {
    const url = selectedRole ? `/api/admin/results?roleId=${selectedRole}` : "/api/admin/results";
    fetch(url).then((r) => r.json()).then(setCandidates);
  }, [selectedRole]);

  const sorted = [...candidates].sort((a, b) => {
    const scoreA = (a.assessment?.score as Record<string, number>)?.[sortBy] ?? -1;
    const scoreB = (b.assessment?.score as Record<string, number>)?.[sortBy] ?? -1;
    return scoreB - scoreA;
  });

  function exportCsv() {
    const headers = "Rank,Name,Email,Role,Composite,Client Focused,Empowering,Productive,Balanced,Reliable,Improving,Transparent\n";
    const rows = sorted.map((c, i) => {
      const s = c.assessment?.score;
      return `${i + 1},${c.name},${c.email},${c.role.name},${s?.compositeScore?.toFixed(1) ?? ""},${s?.clientFocused?.toFixed(1) ?? ""},${s?.empowering?.toFixed(1) ?? ""},${s?.productive?.toFixed(1) ?? ""},${s?.balanced?.toFixed(1) ?? ""},${s?.reliable?.toFixed(1) ?? ""},${s?.improving?.toFixed(1) ?? ""},${s?.transparent?.toFixed(1) ?? ""}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nymbl-ascent-results.csv";
    a.click();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Results</h1>
        <button onClick={exportCsv} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900">Export CSV</button>
      </div>

      <div className="flex gap-4 mb-4">
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="p-2 border rounded-lg text-sm">
          <option value="">All roles</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2 border rounded-lg text-sm">
          <option value="compositeScore">Composite Score</option>
          <option value="clientFocused">Client Focused</option>
          <option value="empowering">Empowering</option>
          <option value="productive">Productive</option>
          <option value="balanced">Balanced</option>
          <option value="reliable">Reliable</option>
          <option value="improving">Improving</option>
          <option value="transparent">Transparent</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-semibold w-12">#</th>
              <th className="text-left p-3 text-sm font-semibold">Candidate</th>
              <th className="text-left p-3 text-sm font-semibold">Role</th>
              <th className="text-right p-3 text-sm font-semibold">Score</th>
              <th className="text-left p-3 text-sm font-semibold">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-gray-400 font-mono">{i + 1}</td>
                <td className="p-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.email}</p>
                </td>
                <td className="p-3">{c.role.name}</td>
                <td className="p-3 text-right font-mono font-bold text-lg">
                  {c.assessment?.score?.compositeScore?.toFixed(1) ?? "—"}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${c.status === "scored" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {c.status === "scored" ? "Scored" : "Scoring..."}
                  </span>
                </td>
                <td className="p-3">
                  <Link href={`/admin/results/${c.id}`} className="text-indigo-600 hover:underline text-sm">View Detail</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Candidate detail page with radar chart**

Create `src/app/admin/results/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RadarChart } from "@/components/admin/RadarChart";
import { TENET_LABELS, type Tenet } from "@/types";

interface CandidateDetail {
  id: string;
  name: string;
  email: string;
  role: { name: string };
  assessment: {
    stage1Data: string | null;
    stage2Data: string | null;
    stage3Data: string | null;
    completedAt: string;
    score: {
      compositeScore: number;
      clientFocused: number;
      empowering: number;
      productive: number;
      balanced: number;
      reliable: number;
      improving: number;
      transparent: number;
      roleFitScore: number;
      behavioralScore: number;
      breakdown: string | null;
      aiAnalysis: string | null;
    } | null;
  } | null;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);

  useEffect(() => {
    fetch(`/api/admin/candidates?candidateId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        // API returns array, find our candidate
        const found = Array.isArray(data) ? data.find((c: { id: string }) => c.id === id) : data;
        setCandidate(found || null);
      });
  }, [id]);

  if (!candidate) return <p>Loading...</p>;

  const score = candidate.assessment?.score;
  const tenets = Object.keys(TENET_LABELS) as Tenet[];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{candidate.name}</h1>
      <p className="text-gray-500 mb-6">{candidate.email} | {candidate.role.name}</p>

      {!score ? (
        <p className="text-orange-600">Scoring in progress...</p>
      ) : (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Tenet Scores</h2>
            <RadarChart
              scores={{
                clientFocused: score.clientFocused,
                empowering: score.empowering,
                productive: score.productive,
                balanced: score.balanced,
                reliable: score.reliable,
                improving: score.improving,
                transparent: score.transparent,
              }}
            />
          </div>

          <div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold mb-3">Composite Score</h2>
              <p className="text-5xl font-bold text-indigo-600">{score.compositeScore.toFixed(1)}</p>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p>Core Values (60%): {((score.clientFocused + score.empowering + score.productive + score.balanced + score.reliable + score.improving + score.transparent) / 7).toFixed(1)}</p>
                <p>Role Fit (25%): {score.roleFitScore.toFixed(1)}</p>
                <p>Behavioral (15%): {score.behavioralScore.toFixed(1)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold mb-3">Per-Tenet Breakdown</h2>
              <div className="space-y-2">
                {tenets.map((t) => (
                  <div key={t} className="flex items-center gap-3">
                    <span className="text-sm w-28">{TENET_LABELS[t]}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${score[t]}%` }} />
                    </div>
                    <span className="text-sm font-mono w-10 text-right">{score[t].toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {score.aiAnalysis && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-lg font-semibold mb-3">AI Analysis</h2>
                <p className="text-gray-700">{score.aiAnalysis}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/results/ src/components/admin/RadarChart.tsx
git commit -m "feat: add results dashboard with ranked list, radar chart, and CSV export"
```

---

## Phase 6: Final Integration

### Task 21: Root Page Redirect & Cleanup

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update root page**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/admin");
}
```

- [ ] **Step 2: Verify full app starts**

```bash
npm run dev
```

Visit `http://localhost:3000` → should redirect to `/admin`.
Visit `http://localhost:3000/assess/test-token-12345` → should show welcome page.

- [ ] **Step 3: Run all tests**

```bash
npx jest
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redirect root to admin dashboard"
```

---

### Task 22: End-to-End Smoke Test

- [ ] **Step 1: Reset and reseed database**

```bash
npx prisma migrate reset --force
```

- [ ] **Step 2: Start dev server and test candidate flow**

```bash
npm run dev
```

Manual test checklist:
1. Visit `/admin` — verify dashboard loads with stats
2. Visit `/admin/roles` — verify 2 seeded roles appear
3. Visit `/admin/scenarios` — verify 7 seeded scenarios appear
4. Visit `/assess/test-token-12345` — verify welcome page loads with "Test Candidate"
5. Click "Begin Assessment" — verify Stage 1 loads with Priority Snap
6. Complete all 3 mini-games — verify transition to Stage 2
7. Complete branching scenarios — verify transition to Stage 3
8. Complete Stage 3 — verify completion screen

- [ ] **Step 3: Verify admin results**

After completing assessment:
1. Visit `/admin/candidates` — verify status shows "completed" or "scored"
2. Visit `/admin/results` — verify candidate appears with scores
3. Click "View Detail" — verify radar chart and tenet breakdown

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: end-to-end smoke test verified"
```

---

## Summary

| Phase | Tasks | What it delivers |
|---|---|---|
| 1: Foundation | 1-3 | Project scaffold, database, seed data |
| 2: Core Libraries | 4-8 | Token system, email, scoring engine, AI integration |
| 3: API Routes | 9-11 | Assessment + admin + scoring APIs |
| 4: Candidate UI | 12-15 | Mini-games, branching scenarios, full assessment flow |
| 5: Admin Panel | 16-20 | Role/scenario/candidate management, results dashboard |
| 6: Integration | 21-22 | Root redirect, smoke test |

**Total: 22 tasks, ~70 steps.** Each task produces a working, committed increment.

---

## Known Gaps (Deferred to Post-MVP or Quick Follows)

These were identified during self-review and are minor enough to not block MVP:

1. **Reminder email button** — Spec says "manual trigger from admin." Add a "Send Reminder" button next to each invited candidate in the candidates table. Reuses `buildInviteEmail` with tweaked subject line.
2. **Decision path replay** — Spec mentions it in results detail. The `stage2Data` JSON is already stored. Add a visual tree walkthrough in the candidate detail page showing which nodes they chose and consequences they saw.
3. **Scenario pool size per role** — The `Role.corePoolSize` field exists in the schema but Stage 2 page hardcodes picking 2 scenarios. Should query the candidate's role and use `corePoolSize` to determine how many scenarios to present.
