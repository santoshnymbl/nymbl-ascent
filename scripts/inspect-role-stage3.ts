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
  const candidate = await prisma.candidate.findFirst({
    where: { status: "scored" },
  });
  if (!candidate) {
    console.log("No candidate found");
    return;
  }
  console.log(`Candidate role: ${candidate.roleId}`);

  const stage3 = await prisma.roleScenario.findMany({
    where: {
      roleId: candidate.roleId,
      scenario: { stage: 3, isPublished: true },
    },
    include: { scenario: true },
  });

  console.log(`\nStage 3 scenarios attached to this role: ${stage3.length}`);
  for (const rs of stage3) {
    console.log(`\n--- ${rs.scenario.title} ---`);
    console.log(`type: ${rs.scenario.type}`);
    console.log(`tree:`, JSON.stringify(JSON.parse(rs.scenario.tree), null, 2).slice(0, 400));
    console.log(`rubric:`, rs.scenario.scoringRubric);
  }
  await prisma.$disconnect();
})();
