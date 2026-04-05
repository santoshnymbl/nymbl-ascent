import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const scenarios = await prisma.scenario.findMany({ where: { stage: 2 } });
  for (const s of scenarios) {
    console.log("\n=== " + s.title + " ===");
    const rubric = JSON.parse(s.scoringRubric);
    console.log("Rubric type:", typeof rubric);
    console.log("Rubric keys:", Object.keys(rubric));
    if (rubric.pathScores) {
      console.log("pathScores keys (first 5):", Object.keys(rubric.pathScores).slice(0, 5));
    } else {
      console.log("Raw rubric (first 300 chars):", JSON.stringify(rubric).slice(0, 300));
    }
  }
  await prisma.$disconnect();
}
main().catch(console.error);
