import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url: process.env.DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
});

(async () => {
  const all = await prisma.score.findMany({ include: { assessment: { include: { candidate: true } } } });
  console.log(`Total scores: ${all.length}\n`);
  for (const s of all) {
    console.log(`--- ${s.assessment.candidate.name} ---`);
    console.log(`composite: ${s.compositeScore.toFixed(2)} (scoredAt ${s.scoredAt.toISOString()})`);
    console.log(`breakdown: ${s.breakdown}`);
    console.log("");
  }
  const score = await prisma.score.findFirst();
  if (score) {
    console.log("Composite:", score.compositeScore);
    console.log("Tenets:", {
      clientFocused: score.clientFocused,
      empowering: score.empowering,
      productive: score.productive,
      balanced: score.balanced,
      reliable: score.reliable,
      improving: score.improving,
      transparent: score.transparent,
    });
    console.log("RoleFit:", score.roleFitScore);
    console.log("Behavioral:", score.behavioralScore);
    console.log("Breakdown:", score.breakdown);
  } else {
    console.log("No scores yet");
  }
  await prisma.$disconnect();
})();
