import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const c = await prisma.candidate.findFirst({
    where: { token: "test-token-12345" },
    include: { assessment: { include: { score: true } } },
  });
  if (!c) { console.log("Not found"); return; }
  console.log("Status:", c.status);

  if (!c.assessment) { console.log("No assessment data"); return; }

  const s1 = c.assessment.stage1Data ? JSON.parse(c.assessment.stage1Data) : null;
  const s2 = c.assessment.stage2Data ? JSON.parse(c.assessment.stage2Data) : null;
  const s3 = c.assessment.stage3Data ? JSON.parse(c.assessment.stage3Data) : null;

  console.log("\n=== STAGE 1 DATA ===");
  if (s1) {
    console.log("Keys:", Object.keys(s1));
    if (s1.triageTower) console.log("  Triage placements:", JSON.stringify(s1.triageTower.placements));
    if (s1.tradeOffTiles) console.log("  TradeOff rounds:", JSON.stringify(s1.tradeOffTiles.rounds));
    if (s1.signalSort) console.log("  SignalSort:", JSON.stringify(s1.signalSort.categorizations));
    if (s1.resourceRoulette) {
      console.log("  Resource initial:", JSON.stringify(s1.resourceRoulette.initialAllocation));
      console.log("  Resource realloc:", JSON.stringify(s1.resourceRoulette.reallocation));
    }
    console.log("  Signals count:", s1.signals?.length || 0);
  } else {
    console.log("  null");
  }

  console.log("\n=== STAGE 2 DATA ===");
  if (s2) {
    console.log("  Scenarios:", s2.scenarios?.length);
    for (const sc of (s2.scenarios || [])) {
      console.log("    Scenario:", sc.scenarioId, "Path:", sc.path?.map((p: any) => p.choiceId).join("->"));
    }
  } else {
    console.log("  null");
  }

  console.log("\n=== STAGE 3 DATA ===");
  console.log("  ", s3 ? JSON.stringify(s3).slice(0, 200) : "null");

  console.log("\n=== SCORES ===");
  if (c.assessment.score) {
    const sc = c.assessment.score;
    console.log("  Client Focused:", sc.clientFocused.toFixed(1));
    console.log("  Empowering:", sc.empowering.toFixed(1));
    console.log("  Productive:", sc.productive.toFixed(1));
    console.log("  Balanced:", sc.balanced.toFixed(1));
    console.log("  Reliable:", sc.reliable.toFixed(1));
    console.log("  Improving:", sc.improving.toFixed(1));
    console.log("  Transparent:", sc.transparent.toFixed(1));
    console.log("  Role Fit:", sc.roleFitScore.toFixed(1));
    console.log("  Behavioral:", sc.behavioralScore.toFixed(1));
    console.log("  COMPOSITE:", sc.compositeScore.toFixed(1));
    console.log("\n  Breakdown:", sc.breakdown);
  } else {
    console.log("  No score computed");
  }

  await prisma.$disconnect();
}
main().catch(console.error);
