import { RowDataPacket } from 'mysql2';
import { pool } from '../lib/db';
import { History, NewHistory } from '../types/domain';

type HistoryRow = History & RowDataPacket;

export async function countByAccount(account: number | string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM history WHERE account = ?',
    [account],
  );
  return Number(rows[0].total);
}

export async function findByAccount(account: number | string): Promise<History[]> {
  const [rows] = await pool.query<HistoryRow[]>(
    'SELECT * FROM history WHERE account = ? ORDER BY date, id',
    [account],
  );
  return rows;
}

export async function getNextDailyId(account: number | string, date: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COALESCE(MAX(id), 0) AS id FROM history WHERE account = ? AND DATE(date) = DATE(?)',
    [account, date],
  );
  return Number(rows[0].id) + 1;
}

export async function save(entry: NewHistory): Promise<void> {
  await pool.query(
    `INSERT INTO history (account, date, id, type, content, money, \`left\`)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [entry.account, entry.date, entry.id, entry.type, entry.content, entry.money, entry.left],
  );
}
