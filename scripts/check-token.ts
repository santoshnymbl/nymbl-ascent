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
  const c = await prisma.candidate.findFirst({
    where: { email: "sam.tripathi@nymbl.app" },
  });
  if (!c) {
    console.log("Not found");
    return;
  }
  const now = new Date();
  console.log(`tokenExpiry: ${c.tokenExpiry.toISOString()}`);
  console.log(`now:         ${now.toISOString()}`);
  console.log(`expired?:    ${now > c.tokenExpiry}`);
  console.log(`assess link: https://nymbl-ascent.vercel.app/assess/${c.token}`);
  await prisma.$disconnect();
})();
