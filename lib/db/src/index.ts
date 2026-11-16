import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

import { EMBEDDED_SCHEMA_SQL } from "./embedded-schema";
import * as schema from "./schema";
import { seedDatabase } from "./seed";

export * from "./schema";

const connectionString = process.env.DATABASE_URL?.trim();

let database: NodePgDatabase<typeof schema>;

if (connectionString) {
  // Real Postgres (Replit, Docker, a local install, ...).
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(49872401)");
    const result = await client.query("SELECT to_regclass('public.users') IS NOT NULL AS present");
    if (!result.rows[0]?.present) await client.query(EMBEDDED_SCHEMA_SQL);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  database = drizzle(pool, { schema });
  console.info("[db] using Postgres from DATABASE_URL");
} else {
  // Local development without a Postgres server: embedded Postgres (WASM).
  // Data is persisted under `<repo>/.data/pglite`.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const { mkdir } = await import("node:fs/promises");

  const rootDir = fileURLToPath(new URL("../../../", import.meta.url));
  const dataDir =
    process.env.PGLITE_DATA_DIR ?? path.join(rootDir, ".data", "pglite");

  // PGlite creates the data directory itself but not its parents.
  await mkdir(path.dirname(dataDir), { recursive: true });

  const client = new PGlite(dataDir);
  await client.waitReady;

  const existing = await client.query<{ exists: boolean }>(
    "select exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'users') as exists",
  );

  if (!existing.rows[0]?.exists) {
    await client.exec(EMBEDDED_SCHEMA_SQL);
    console.info("[db] created schema in embedded PGlite");
  }

  const pglite = drizzlePglite(client, { schema });

  database = pglite as unknown as NodePgDatabase<typeof schema>;

  if (process.env.NODE_ENV !== "production") {
    await seedDatabase(database);
  }

  console.info(`[db] using embedded PGlite at ${dataDir}`);
}

export const db = database;
