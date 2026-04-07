/**
 * Re-scores every completed candidate on Turso with the NEW scoring
 * pipeline (Fix 1 + Fix 2). Reads existing stage1Data/stage2Data/stage3Data
 * from Turso and calls runScoring() directly — no dev server required.
 *
 *   DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." ANTHROPIC_API_KEY="sk-..." \
 *     npx tsx scripts/rescore-all-turso.ts
 *
 * Prints a before/after composite for each candidate.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { runScoring } from "../src/lib/run-scoring";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!process.env.DATABASE_URL?.startsWith("libsql://")) {
    console.error("This script is meant for Turso. Set DATABASE_URL=libsql://...");
    process.exit(1);
  }
  console.log(`\nTarget: ${process.env.DATABASE_URL}`);

  const candidates = await prisma.candidate.findMany({
    include: { assessment: { include: { score: true } } },
  });

  const scored = candidates.filter(
    (c) => c.assessment?.score && c.assessment.stage1Data,
  );

  console.log(`\nFound ${scored.length} candidates with prior scores to re-run:\n`);

  for (const c of scored) {
    const prev = c.assessment!.score!;
    console.log(`\n━━━ ${c.name} <${c.email}> ━━━`);
    console.log(`  BEFORE: composite=${prev.compositeScore.toFixed(2)} roleFit=${prev.roleFitScore} beh=${prev.behavioralScore}`);
    for (const t of ["clientFocused", "empowering", "productive", "balanced", "reliable", "improving", "transparent"] as const) {
      process.stdout.write(`    ${t}:${(prev[t] as number).toFixed(1).padStart(5)} `);
    }
    console.log();

    const oldBreakdown = prev.breakdown ? JSON.parse(prev.breakdown) : {};
    console.log(`    old stage2Scores: ${JSON.stringify(oldBreakdown.stage2Scores)}`);

    const result = await runScoring(c.id);
    if (!result.ok) {
      console.log(`  ✗ Scoring failed: ${result.error}`);
      continue;
    }

    // Re-fetch to see new breakdown
    const updated = await prisma.score.findFirst({
      where: { assessment: { candidateId: c.id } },
    });
    if (!updated) continue;

    console.log(`  AFTER:  composite=${updated.compositeScore.toFixed(2)} roleFit=${updated.roleFitScore} beh=${updated.behavioralScore}`);
    for (const t of ["clientFocused", "empowering", "productive", "balanced", "reliable", "improving", "transparent"] as const) {
      process.stdout.write(`    ${t}:${(updated[t] as number).toFixed(1).padStart(5)} `);
    }
    console.log();

    const newBreakdown = updated.breakdown ? JSON.parse(updated.breakdown) : {};
    console.log(`    new stage2Scores: ${JSON.stringify(newBreakdown.stage2Scores)}`);
    console.log(`    stage2Measured:   ${JSON.stringify(newBreakdown.stage2Measured)}`);
    console.log(`    new aiScores:     ${JSON.stringify(newBreakdown.aiScores)}`);

    const delta = updated.compositeScore - prev.compositeScore;
    console.log(`  Δ composite: ${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
