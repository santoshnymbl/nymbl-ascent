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
  const a = await prisma.assessment.findFirst({ include: { candidate: true } });
  if (a?.stage3Data) {
    const parsed = JSON.parse(a.stage3Data);
    console.log("stage3Data:", JSON.stringify(parsed, null, 2));
  }
  await prisma.$disconnect();
})();
