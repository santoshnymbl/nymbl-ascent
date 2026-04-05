import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const token = process.argv[2] || "test-token-12345";
  const c = await prisma.candidate.findFirst({ where: { token } });
  if (!c) { console.log("Candidate not found for token:", token); return; }
  console.log("Found:", c.name, "| Status:", c.status);

  await prisma.score.deleteMany({ where: { assessment: { candidateId: c.id } } });
  await prisma.assessment.deleteMany({ where: { candidateId: c.id } });

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  await prisma.candidate.update({
    where: { id: c.id },
    data: { status: "invited", tokenExpiry: expiry },
  });

  console.log("Reset to: invited | Token valid until:", expiry.toISOString());
  await prisma.$disconnect();
}
main().catch(console.error);
