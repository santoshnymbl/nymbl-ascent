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
  const all = await prisma.candidate.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, status: true, token: true, createdAt: true },
  });
  console.log(`Total candidates: ${all.length}\n`);
  for (const c of all) {
    console.log(`${c.status.padEnd(12)} ${c.name.padEnd(20)} ${c.email.padEnd(30)} token=${c.token.slice(0, 12)}... created=${c.createdAt.toISOString()}`);
  }
  await prisma.$disconnect();
})();
