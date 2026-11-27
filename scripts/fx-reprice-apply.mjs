// Applies a .sql file to the gateway Postgres using the app's own DATABASE_URL
// (role `gateway`), so unattended jobs (cron) never need sudo/docker.
//
// Usage: node scripts/fx-reprice-apply.mjs <path-to.sql>
//
// The file is sent as a single simple-query string, so explicit BEGIN/COMMIT and
// multiple statements are honoured exactly as psql would. Idempotent SQL stays
// idempotent. Never prints DATABASE_URL or any credential.
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("usage: fx-reprice-apply.mjs <path-to.sql>");
  process.exit(2);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(2);
}

const sql = readFileSync(file, "utf8");
const pool = new pg.Pool({ connectionString: url, ssl: false, max: 1 });
try {
  const res = await pool.query(sql);
  // For a multi-statement simple query, node-pg returns the last result.
  const cmd = res?.command ?? "?";
  const rows = res?.rowCount ?? 0;
  console.log(`applied ${file} (last statement: ${cmd} ${rows})`);
} catch (err) {
  console.error(`FAILED to apply ${file}: ${err.message}`);
  process.exit(1);
} finally {
  await pool.end();
}
