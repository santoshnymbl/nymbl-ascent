/**
 * Copies missing CREATE INDEX statements from the local SQLite DB to Turso.
 * Fixes the original migration which only copied tables, missing the unique
 * indexes Prisma uses for upsert / @unique fields.
 *
 *   npx tsx scripts/fix-turso-indexes.ts
 */

import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const local = createClient({ url: "file:dev.db" });
const remote = createClient({
  url: process.env.TURSO_URL || process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  console.log("🔍 Reading indexes from local SQLite...");

  const { rows: localIndexes } = await local.execute(
    `SELECT name, sql FROM sqlite_master
     WHERE type='index' AND sql IS NOT NULL
     ORDER BY name`,
  );

  console.log(`   Found ${localIndexes.length} indexes locally\n`);

  console.log("🔍 Reading indexes from Turso...");
  const { rows: remoteIndexes } = await remote.execute(
    `SELECT name FROM sqlite_master WHERE type='index'`,
  );
  const remoteIndexNames = new Set(remoteIndexes.map((r) => r.name as string));
  console.log(`   Found ${remoteIndexes.length} indexes remotely\n`);

  let created = 0;
  let skipped = 0;

  for (const idx of localIndexes) {
    const name = idx.name as string;
    const sql = idx.sql as string;

    if (remoteIndexNames.has(name)) {
      console.log(`   ⊘ ${name} (already exists)`);
      skipped++;
      continue;
    }

    try {
      await remote.execute(sql);
      console.log(`   ✓ ${name}`);
      console.log(`      ${sql}`);
      created++;
    } catch (err) {
      console.error(`   ❌ ${name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n✅ Done. Created ${created}, skipped ${skipped}.`);
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => {
    local.close();
    remote.close();
  });
