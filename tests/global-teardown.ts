// Close the shared connection pool so jest can exit cleanly when
// forceExit isn't desired locally.
export default async function teardown(): Promise<void> {
  // Loaded lazily — the pool is created on first require.
  const { pool } = await import('../src/lib/db');
  await pool.end();
}
