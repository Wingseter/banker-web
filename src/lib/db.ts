import mysql, { Pool, PoolConnection, PoolOptions } from 'mysql2/promise';

const config: PoolOptions = {
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT ?? '10', 10),
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'bank',
  multipleStatements: false,
  dateStrings: false,
};

export const pool: Pool = mysql.createPool(config);

/**
 * Run `fn` inside a single transaction. Commits on success, rolls back on
 * thrown error. The connection is always released. The throwing error is
 * re-raised so the caller can map it to an HTTP response.
 */
export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      // swallow rollback failure — the original error is more interesting
    }
    throw err;
  } finally {
    conn.release();
  }
}
