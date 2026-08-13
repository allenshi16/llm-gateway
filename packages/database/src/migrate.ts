import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { database } from "./index.js";

const migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), "../../../infra/postgres");

async function run(): Promise<void> {
  const files = (await readdir(migrationsDirectory)).filter((file) => /^\d{3}-.*\.sql$/.test(file)).sort();
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
    for (const file of files) {
      const version = basename(file, ".sql");
      const sql = await readFile(join(migrationsDirectory, file), "utf8");
      const checksum = createHash("sha256").update(sql, "utf8").digest("hex");
      const existing = await client.query<{ checksum: string }>("SELECT checksum FROM schema_migrations WHERE version=$1", [version]);
      const row = existing.rows[0];
      if (row) {
        if (row.checksum !== checksum) throw new Error(`Migration checksum mismatch: ${version}`);
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version, checksum) VALUES ($1,$2)", [version, checksum]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await database.end();
  }
}

await run();
