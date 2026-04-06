/**
 * One-shot migration: copies all rows from local SQLite (prisma/dev.db)
 * to a Turso database. Run with:
 *
 *   npx tsx scripts/migrate-to-turso.ts
 *
 * Requires these env vars (set in .env.local or pass inline):
 *   TURSO_URL          libsql://your-db.turso.io
 *   TURSO_AUTH_TOKEN   the token from `turso db tokens create` (or web dashboard)
 */

import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const TURSO_URL = process.env.TURSO_URL || process.env.DATABASE_URL_TURSO;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_URL.startsWith("libsql://")) {
  console.error("❌ TURSO_URL must be set to a libsql:// URL");
  console.error("   Add to .env.local:  TURSO_URL=libsql://your-db.turso.io");
  process.exit(1);
}
if (!TURSO_AUTH_TOKEN) {
  console.error("❌ TURSO_AUTH_TOKEN must be set");
  console.error("   Get one from the Turso dashboard → your DB → Generate Token");
  process.exit(1);
}

// Source: local SQLite file (resolved from project root, matching DATABASE_URL="file:./dev.db")
const local = createClient({ url: "file:dev.db" });

// Destination: Turso
const remote = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// Tables in dependency order (parents before children)
const TABLES = [
  "Role",
  "Scenario",
  "RoleScenario",
  "Candidate",
  "Assessment",
  "Score",
];

async function getSchema(table: string): Promise<string> {
  const res = await local.execute({
    sql: "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
    args: [table],
  });
  if (res.rows.length === 0) throw new Error(`Table ${table} not found locally`);
  return res.rows[0].sql as string;
}

async function copyTable(table: string) {
  console.log(`\n📋 ${table}`);

  // 1. Get schema from local DB and create on remote
  const schema = await getSchema(table);
  await remote.execute(`DROP TABLE IF EXISTS "${table}"`);
  await remote.execute(schema);
  console.log(`   ✓ schema created`);

  // 2. Read all rows from local
  const { rows, columns } = await local.execute(`SELECT * FROM "${table}"`);
  if (rows.length === 0) {
    console.log(`   (empty)`);
    return;
  }

  // 3. Bulk insert into remote
  const colList = columns.map((c) => `"${c}"`).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  const insertSql = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`;

  let inserted = 0;
  for (const row of rows) {
    const args = columns.map((c) => row[c] as string | number | null);
    await remote.execute({ sql: insertSql, args });
    inserted++;
  }
  console.log(`   ✓ ${inserted} row${inserted === 1 ? "" : "s"} copied`);
}

async function main() {
  console.log("🚀 Migrating local SQLite → Turso");
  console.log(`   Source: prisma/dev.db`);
  console.log(`   Target: ${TURSO_URL}`);

  for (const table of TABLES) {
    try {
      await copyTable(table);
    } catch (err) {
      console.error(`❌ Failed on ${table}:`, err);
      process.exit(1);
    }
  }

  console.log("\n✅ Migration complete. Verify with:");
  for (const table of TABLES) {
    const { rows } = await remote.execute(`SELECT COUNT(*) as c FROM "${table}"`);
    console.log(`   ${table.padEnd(15)} ${rows[0].c} rows`);
  }
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    local.close();
    remote.close();
  });
