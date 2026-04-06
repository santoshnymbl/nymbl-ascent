import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const arg = process.argv[2] || "test-token-12345";

  // Try matching by token first, then by email/name (LIKE)
  let candidates = await prisma.candidate.findMany({
    where: {
      OR: [
        { token: arg },
        { email: { contains: arg } },
        { name: { contains: arg } },
      ],
    },
    include: { assessment: { include: { score: true } } },
  });

  if (candidates.length === 0) {
    console.log(`No candidate found matching "${arg}"`);
    return;
  }

  for (const c of candidates) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📋 ${c.name} <${c.email}>`);
    console.log(`   id:        ${c.id}`);
    console.log(`   status:    ${c.status}`);
    console.log(`   roleId:    ${c.roleId}`);
    console.log(`   token:     ${c.token}`);
    console.log(`   createdAt: ${c.createdAt.toISOString()}`);
    console.log(`   updatedAt: ${c.updatedAt.toISOString()}`);

    if (!c.assessment) {
      console.log(`\n   ⚠️  No Assessment row → never reached /api/assess/progress`);
      console.log(`   → Candidate likely never opened the link or hit an error before any save`);
      continue;
    }

    const a = c.assessment;
    console.log(`\n   📊 Assessment ${a.id}`);
    console.log(`      currentStage: ${a.currentStage}`);
    console.log(`      stage1Data:   ${a.stage1Data ? `✓ saved (${a.stage1Data.length} chars)` : "✗ none"}`);
    console.log(`      stage2Data:   ${a.stage2Data ? `✓ saved (${a.stage2Data.length} chars)` : "✗ none"}`);
    console.log(`      stage3Data:   ${a.stage3Data ? `✓ saved (${a.stage3Data.length} chars)` : "✗ none"}`);
    console.log(`      completedAt:  ${a.completedAt?.toISOString() || "✗ not completed"}`);
    console.log(`      updatedAt:    ${a.updatedAt.toISOString()}`);

    if (a.score) {
      console.log(`\n   📈 Score composite=${a.score.compositeScore.toFixed(1)}  scoredAt=${a.score.scoredAt.toISOString()}`);
    } else {
      console.log(`\n   📈 No Score row → scoring never ran`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
