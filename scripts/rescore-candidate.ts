import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const c = await prisma.candidate.findFirst({ where: { token: "test-token-12345" } });
  if (!c) { console.log("Not found"); return; }

  // Delete existing score
  await prisma.score.deleteMany({ where: { assessment: { candidateId: c.id } } });
  await prisma.candidate.update({ where: { id: c.id }, data: { status: "completed" } });
  console.log("Score cleared. Re-triggering scoring...");

  // Trigger scoring API
  const res = await fetch("http://localhost:3000/api/scoring", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId: c.id }),
  });
  const result = await res.json();
  console.log("Scoring result:", JSON.stringify(result, null, 2));

  // Fetch updated scores
  const updated = await prisma.candidate.findFirst({
    where: { id: c.id },
    include: { assessment: { include: { score: true } } },
  });
  if (updated?.assessment?.score) {
    const sc = updated.assessment.score;
    console.log("\nNew scores:");
    console.log("  Client Focused:", sc.clientFocused.toFixed(1));
    console.log("  Empowering:", sc.empowering.toFixed(1));
    console.log("  Productive:", sc.productive.toFixed(1));
    console.log("  Balanced:", sc.balanced.toFixed(1));
    console.log("  Reliable:", sc.reliable.toFixed(1));
    console.log("  Improving:", sc.improving.toFixed(1));
    console.log("  Transparent:", sc.transparent.toFixed(1));
    console.log("  COMPOSITE:", sc.compositeScore.toFixed(1));
  }
  await prisma.$disconnect();
}
main().catch(console.error);
