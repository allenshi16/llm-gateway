import pg from "pg";

const { Pool } = pg;

export const database = new Pool({
  connectionString: process.env["DATABASE_URL"],
  max: Number(process.env["DATABASE_POOL_SIZE"] ?? 10),
  idleTimeoutMillis: 30_000
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values: readonly unknown[] = []): Promise<pg.QueryResult<T>> {
  return database.query<T>(text, Array.from(values));
}

export async function withTransaction<T>(operation: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
