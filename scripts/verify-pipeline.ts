/**
 * End-to-end verification script for the three scoring fixes.
 *
 *   npx tsx scripts/verify-pipeline.ts
 *
 * Runs against whatever DATABASE_URL points to in .env (or env). Designed
 * to be run locally against the file:./dev.db copy, never against Turso
 * (it creates/deletes candidates).
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { runScoring } from "../src/lib/run-scoring";
import type {
  Stage1Result,
  Stage2Result,
  Stage3Result,
} from "../src/types";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const DIVIDER = "━".repeat(70);

async function verifyStage1Pools() {
  console.log(`\n${DIVIDER}\n  STEP 1 — Seed pool sizes\n${DIVIDER}`);
  const s1 = await prisma.scenario.findMany({
    where: { stage: 1, type: "core" },
  });
  const expected: Record<string, number> = {
    "triage-tower": 15,
    "trade-off-tiles": 15,
    "signal-sort": 18,
    "resource-roulette": 12,
  };
  let ok = true;
  for (const s of s1) {
    const t = JSON.parse(s.tree);
    const size =
      t.items?.length ?? t.pairs?.length ?? t.messages?.length ?? t.cards?.length ?? 0;
    const exp = expected[t.type] ?? 0;
    const mark = size === exp ? "✓" : "✗";
    if (size !== exp) ok = false;
    console.log(`  ${mark} ${t.type.padEnd(20)} ${size} / ${exp}`);
  }
  console.log(ok ? "  → Pool sizes correct." : "  → POOL SIZES WRONG");
  return ok;
}

async function verifySamplingEndpoint(candidateToken: string) {
  console.log(`\n${DIVIDER}\n  STEP 2 — Random sampling (simulate 3 API calls)\n${DIVIDER}`);
  // Call the sampling helper directly via the API route logic. Simplest:
  // import the route handler. But route handlers are server-only — instead
  // replicate the shuffle+slice inline here to prove the logic works.
  //
  // For a real HTTP check we'd hit /api/assess/scenarios — but that needs
  // the dev server running. This inline check validates determinism of
  // the helper rather than the HTTP path; the HTTP path is covered by
  // manual incognito testing.

  const { GET } = await import("../src/app/api/assess/scenarios/route");
  const { NextRequest } = await import("next/server");
  const runs: Array<Record<string, string[]>> = [];
  for (let i = 0; i < 3; i++) {
    const req = new NextRequest(
      `http://localhost/api/assess/scenarios?token=${candidateToken}&stage=1`,
    );
    const res = await GET(req);
    const data = (await res.json()) as Array<{ tree: Record<string, unknown> }>;
    const ids: Record<string, string[]> = {};
    for (const s of data) {
      const t = s.tree;
      if (t.type === "triage-tower") ids["triage"] = (t.items as Array<{ id: string }>).map((i) => i.id);
      else if (t.type === "trade-off-tiles") ids["tradeoff"] = (t.pairs as Array<{ id: string }>).map((i) => i.id);
      else if (t.type === "signal-sort") ids["signal"] = (t.messages as Array<{ id: string }>).map((i) => i.id);
      else if (t.type === "resource-roulette") ids["resource"] = (t.cards as Array<{ id: string }>).map((i) => i.id);
    }
    runs.push(ids);
    console.log(`  Draw ${i + 1}:`);
    console.log(`    triage   (${ids.triage?.length}): ${ids.triage?.join(", ")}`);
    console.log(`    tradeoff (${ids.tradeoff?.length}): ${ids.tradeoff?.join(", ")}`);
    console.log(`    signal   (${ids.signal?.length}): ${ids.signal?.join(", ")}`);
    console.log(`    resource (${ids.resource?.length}): ${ids.resource?.join(", ")}`);
  }

  // Did different draws actually differ?
  const serialize = (r: Record<string, string[]>) =>
    JSON.stringify([r.triage, r.tradeoff, r.signal, r.resource]);
  const unique = new Set(runs.map(serialize));
  const different = unique.size > 1;
  console.log(different ? "  → ✓ Draws differ across calls." : "  → ✗ ALL DRAWS IDENTICAL (sampling broken?)");

  // Did all runs include the resource-roulette curveball target?
  const allHavePinned = runs.every((r) => r.resource?.includes("client"));
  console.log(
    allHavePinned
      ? "  → ✓ Resource Roulette always includes curveball-target 'client' card."
      : "  → ✗ Curveball target card MISSING from some draws",
  );

  // Triage always has exactly 1 interrupt
  const allOneInterrupt = runs.every((r) => {
    const interrupts = r.triage?.filter((id) =>
      ["urgent-deploy", "ceo-escalation", "security-alert"].includes(id),
    );
    return interrupts?.length === 1;
  });
  console.log(
    allOneInterrupt
      ? "  → ✓ Triage Tower draws always include exactly 1 interrupt."
      : "  → ✗ Triage interrupt count wrong in some draws",
  );

  return different && allHavePinned && allOneInterrupt;
}

async function createTestCandidate(
  name: string,
  email: string,
  token: string,
  roleId: string,
) {
  // Clean up any prior test candidate with this token
  const existing = await prisma.candidate.findFirst({ where: { token } });
  if (existing) {
    await prisma.score.deleteMany({
      where: { assessment: { candidateId: existing.id } },
    });
    await prisma.assessment.deleteMany({ where: { candidateId: existing.id } });
    await prisma.candidate.delete({ where: { id: existing.id } });
  }
  return prisma.candidate.create({
    data: {
      name,
      email,
      token,
      roleId,
      status: "in_progress",
      tokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

/**
 * Fabricate a realistic Stage 1 result that a candidate might produce.
 * Uses the first N items from each pool — the scoring code looks up
 * items by id, so any subset scores correctly.
 */
async function fabricateStage1(): Promise<Stage1Result> {
  const s1 = await prisma.scenario.findMany({
    where: { stage: 1, type: "core" },
  });
  const byType: Record<string, Record<string, unknown>> = {};
  for (const s of s1) {
    const t = JSON.parse(s.tree);
    byType[t.type] = t;
  }

  const triageItems = (byType["triage-tower"].items as Array<{ id: string; isInterrupt?: boolean }>).slice(0, 6);
  const tradeOffPairs = (byType["trade-off-tiles"].pairs as Array<{ id: string }>).slice(0, 5);
  const signalMessages = (byType["signal-sort"].messages as Array<{ id: string }>).slice(0, 6);
  const resourceCards = (byType["resource-roulette"].cards as Array<{ id: string }>).slice(0, 4);

  return {
    triageTower: {
      placements: triageItems.map((item, i) => ({
        itemId: item.id,
        bin: ["doNow", "doNext", "delegate"][i % 3] as "doNow" | "doNext" | "delegate",
      })),
      interruptBump: null,
      timeMs: 60000,
      revisions: 1,
    },
    tradeOffTiles: {
      rounds: tradeOffPairs.map((p, i) => ({
        pairId: p.id,
        sliderPosition: [-2, 1, 0, 2, -1][i] as -2 | -1 | 0 | 1 | 2,
        timeMs: 5000,
      })),
      timeMs: 35000,
    },
    signalSort: {
      categorizations: signalMessages.map((m, i) => ({
        messageId: m.id,
        category: i % 2 === 0 ? "ideal" : "improve",
      })),
      timeMs: 40000,
      dragSequence: signalMessages.map((m) => m.id),
    },
    resourceRoulette: {
      initialAllocation: resourceCards.map((c, i) => ({
        cardId: c.id,
        tokens: [4, 3, 2, 1][i],
      })),
      curveball: "client",
      reallocation: resourceCards.map((c, i) => ({
        cardId: c.id,
        tokens: [5, 2, 2, 1][i],
      })),
      timeMs: 40000,
      reallocationTimeMs: 15000,
    },
    signals: [
      { event: "choice_made", timestamp: 1000, data: {} },
      { event: "choice_made", timestamp: 6000, data: {} },
      { event: "choice_made", timestamp: 12000, data: {} },
      { event: "revision", timestamp: 7000, data: {} },
    ],
  };
}

/**
 * Fabricate a Stage 2 result where the candidate picks paths that only
 * cover SOME tenets — this is the scenario where Fix 1 matters. If the
 * old code ran, unmeasured tenets would score 0; now they fall back to
 * Stage 1.
 */
async function fabricateStage2(roleId: string): Promise<{
  result: Stage2Result;
  scenarioIds: string[];
}> {
  // Find the Stage 2 scenarios attached to this role
  const roleScenarios = await prisma.roleScenario.findMany({
    where: { roleId, scenario: { stage: 2, isPublished: true } },
    include: { scenario: true },
  });

  const scenarios = roleScenarios.map((rs) => rs.scenario);
  if (scenarios.length === 0) {
    throw new Error(`No Stage 2 scenarios attached to role ${roleId}`);
  }

  // For each attached scenario, walk the tree to build a path the
  // candidate "took." We pick the first option at each node so we get a
  // deterministic, scoreable path.
  const played: Stage2Result["scenarios"] = [];
  for (const s of scenarios.slice(0, 2)) {
    const tree = JSON.parse(s.tree);
    const path: { nodeId: string; choiceId: string; timeMs: number }[] = [];
    let currentNode = tree.nodes?.[tree.rootNodeId];
    for (let i = 0; i < 3 && currentNode?.options?.length; i++) {
      const choice = currentNode.options[0];
      path.push({
        nodeId: currentNode.id,
        choiceId: choice.id,
        timeMs: 8000,
      });
      if (!choice.nextNodeId) break;
      currentNode = tree.nodes[choice.nextNodeId];
    }
    played.push({ scenarioId: s.id, path });
  }

  return {
    result: { scenarios: played, signals: [] },
    scenarioIds: scenarios.map((s) => s.id),
  };
}

async function fabricateStage3(roleId: string): Promise<Stage3Result | null> {
  const stage3 = await prisma.roleScenario.findMany({
    where: { roleId, scenario: { stage: 3, isPublished: true } },
    include: { scenario: true },
  });
  if (stage3.length === 0) return null;

  const s = stage3[0].scenario;
  const tree = JSON.parse(s.tree);

  if ("type" in tree && tree.type === "debug-challenge") {
    return {
      challengeType: "debug-challenge",
      responses: { answer: "off-by-one", followUp: "trace-manually" },
      timeMs: 120000,
      signals: [],
    };
  }
  // Branching: walk first-option path
  const path: { nodeId: string; choiceId: string; timeMs: number }[] = [];
  let currentNode = tree.nodes?.[tree.rootNodeId];
  for (let i = 0; i < 3 && currentNode?.options?.length; i++) {
    const choice = currentNode.options[0];
    path.push({
      nodeId: currentNode.id,
      choiceId: choice.id,
      timeMs: 10000,
    });
    if (!choice.nextNodeId) break;
    currentNode = tree.nodes[choice.nextNodeId];
  }
  return {
    challengeType: "branching",
    responses: { path },
    timeMs: 50000,
    signals: [],
  };
}

async function runFullPipeline(label: string, token: string) {
  console.log(`\n${DIVIDER}\n  STEP 3 — Full pipeline: ${label}\n${DIVIDER}`);

  const role = await prisma.role.findFirst({
    where: {
      roleScenarios: { some: { scenario: { stage: 2 } } },
    },
  });
  if (!role) throw new Error("No role with Stage 2 scenarios found");

  const candidate = await createTestCandidate(
    `Verify ${label}`,
    `verify-${label.toLowerCase()}@example.com`,
    token,
    role.id,
  );

  // Fabricate the three stages
  const stage1 = await fabricateStage1();
  const { result: stage2 } = await fabricateStage2(role.id);
  const stage3 = await fabricateStage3(role.id);

  // Persist via Assessment row
  await prisma.assessment.create({
    data: {
      candidateId: candidate.id,
      currentStage: 3,
      stage1Data: JSON.stringify(stage1),
      stage2Data: JSON.stringify(stage2),
      stage3Data: stage3 ? JSON.stringify(stage3) : null,
      completedAt: new Date(),
    },
  });

  console.log(`  Role: ${role.name}`);
  console.log(`  Stage 2 scenarios played: ${stage2.scenarios.length}`);
  console.log(`  Stage 3: ${stage3 ? stage3.challengeType : "none"}`);
  console.log(`  Running scoring...`);

  const scored = await runScoring(candidate.id);
  if (!scored.ok) {
    console.error(`  ✗ Scoring failed: ${scored.error}`);
    return false;
  }

  // Pull the score row to show the breakdown
  const score = await prisma.score.findFirst({
    where: { assessment: { candidateId: candidate.id } },
    include: { assessment: true },
  });
  if (!score) return false;

  const breakdown = score.breakdown ? JSON.parse(score.breakdown) : {};
  console.log(`\n  COMPOSITE: ${score.compositeScore.toFixed(2)}`);
  console.log(`  RoleFit:   ${score.roleFitScore}`);
  console.log(`  Behavioral: ${score.behavioralScore}`);
  console.log(`\n  Final Tenets (after all merges):`);
  for (const t of ["clientFocused", "empowering", "productive", "balanced", "reliable", "improving", "transparent"] as const) {
    console.log(`    ${t.padEnd(14)} ${(score[t] as number).toFixed(1)}`);
  }
  console.log(`\n  Stage 1 tenets:`);
  console.log(`    ${JSON.stringify(breakdown.stage1Scores, null, 2).replace(/\n/g, "\n    ")}`);
  console.log(`\n  Stage 2 tenets (measured only):`);
  console.log(`    ${JSON.stringify(breakdown.stage2Scores, null, 2).replace(/\n/g, "\n    ")}`);
  console.log(`  Stage 2 measured set: ${JSON.stringify(breakdown.stage2Measured)}`);
  console.log(`\n  Stage 3 detail:`);
  console.log(`    ${JSON.stringify(breakdown.stage3, null, 2).replace(/\n/g, "\n    ")}`);
  console.log(`\n  AI scores:`);
  if (breakdown.aiScores) {
    console.log(`    ${JSON.stringify(breakdown.aiScores, null, 2).replace(/\n/g, "\n    ")}`);
  } else {
    console.log(`    (AI scoring skipped — ANTHROPIC_API_KEY not set)`);
  }

  // Fix 1 verification: if Stage 2 measured fewer than 7 tenets, the
  // unmeasured ones in the final score should equal Stage 1's value,
  // not be diluted toward 0.
  const measured: string[] = breakdown.stage2Measured ?? [];
  const unmeasured = [
    "clientFocused", "empowering", "productive", "balanced",
    "reliable", "improving", "transparent",
  ].filter((t) => !measured.includes(t));

  if (unmeasured.length > 0) {
    console.log(`\n  FIX 1 CHECK: ${unmeasured.length} tenets unmeasured by Stage 2: ${unmeasured.join(", ")}`);
    console.log(`  Expected: final[t] ≈ stage1[t]*0.8 + ai[t]*0.2 (NO zero-drag from Stage 2)`);
    let pass = true;
    for (const t of unmeasured) {
      const s1v = (breakdown.stage1Scores as Record<string, number>)[t];
      const aiv = (breakdown.aiScores as Record<string, number> | null)?.[t] ?? 0;
      const expected = aiv ? s1v * 0.8 + aiv * 0.2 : s1v;
      const actual = score[t as keyof typeof score] as number;
      const diff = Math.abs(expected - actual);
      const mark = diff < 0.5 ? "✓" : "✗";
      if (diff >= 0.5) pass = false;
      console.log(`    ${mark} ${t.padEnd(14)} expected ${expected.toFixed(1)}, got ${actual.toFixed(1)}`);
    }
    console.log(pass ? "  → ✓ Fix 1 working — unmeasured tenets fall back correctly." : "  → ✗ FIX 1 BROKEN");
  } else {
    console.log(`\n  (All 7 tenets measured by Stage 2 — Fix 1 fallback path not exercised this run.)`);
  }

  // Fix 2 verification: AI weight is 20%, so final tenet for measured
  // case = (s1*0.4 + s2*0.6) * 0.8 + ai * 0.2 (or just s1*0.4 + s2*0.6 if AI skipped).
  if (measured.length > 0) {
    const sample = measured[0];
    const s1v = (breakdown.stage1Scores as Record<string, number>)[sample];
    const s2v = (breakdown.stage2Scores as Record<string, number>)[sample];
    const aiv = breakdown.aiScores
      ? (breakdown.aiScores as Record<string, number>)[sample]
      : null;
    const merged12 = s1v * 0.4 + s2v * 0.6;
    const expected = aiv !== null ? merged12 * 0.8 + aiv * 0.2 : merged12;
    const actual = score[sample as keyof typeof score] as number;
    const diff = Math.abs(expected - actual);
    const mark = diff < 0.5 ? "✓" : "✗";
    console.log(
      `\n  FIX 2 CHECK (sample ${sample}): s1=${s1v.toFixed(1)} s2=${s2v.toFixed(1)} ai=${aiv === null ? "skip" : aiv.toFixed(1)}`,
    );
    console.log(`    expected ${expected.toFixed(1)}, got ${actual.toFixed(1)} ${mark}`);
    console.log(
      diff < 0.5
        ? aiv !== null
          ? "  → ✓ Fix 2 working — AI weight is 20%."
          : "  → ✓ Merge math correct (AI skipped, pure Stage 1/2 blend)."
        : "  → ✗ FIX 2 BROKEN — weight mismatch.",
    );
  }

  return true;
}

async function main() {
  console.log(`\n🔬 Pipeline Verification — ${process.env.DATABASE_URL}\n`);

  if (process.env.DATABASE_URL?.startsWith("libsql://")) {
    console.error("REFUSING to run against Turso. Set DATABASE_URL=file:./dev.db");
    process.exit(1);
  }

  const s1ok = await verifyStage1Pools();
  if (!s1ok) {
    console.error("\n✗ Stage 1 pool sizes wrong — did you run `npx prisma db seed`?");
    process.exit(1);
  }

  // Create a temp candidate so the sampling endpoint has something to auth with.
  const role = await prisma.role.findFirst();
  if (!role) throw new Error("No roles in DB — seed the database first.");
  const tempCand = await createTestCandidate(
    "Sampling Test",
    "sampling@example.com",
    "sampling-test-token-abc",
    role.id,
  );

  const samplingOk = await verifySamplingEndpoint("sampling-test-token-abc");

  // Clean up sampling candidate
  await prisma.assessment.deleteMany({ where: { candidateId: tempCand.id } });
  await prisma.candidate.delete({ where: { id: tempCand.id } });

  // Full pipeline with fabricated data
  const pipelineOk = await runFullPipeline("A", "verify-a-token-111");

  console.log(`\n${DIVIDER}\n  SUMMARY\n${DIVIDER}`);
  console.log(`  Pool sizes:         ${s1ok ? "✓" : "✗"}`);
  console.log(`  Sampling:           ${samplingOk ? "✓" : "✗"}`);
  console.log(`  Full pipeline:      ${pipelineOk ? "✓" : "✗"}`);
  console.log("");

  await prisma.$disconnect();
  if (!s1ok || !samplingOk || !pipelineOk) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
