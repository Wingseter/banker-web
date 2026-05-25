import { RowDataPacket } from 'mysql2';
import { pool } from '../lib/db';
import { Account, NewAccount } from '../types/domain';

type AccountRow = Account & RowDataPacket;

export async function countByUser(user: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM accounts WHERE user = ?',
    [user],
  );
  return Number(rows[0].total);
}

export async function getByUser(user: number): Promise<Account[]> {
  const [rows] = await pool.query<AccountRow[]>('SELECT * FROM accounts WHERE user = ?', [user]);
  return rows;
}

export async function getIdsByUser(user: number): Promise<{ id: number }[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM accounts WHERE user = ?',
    [user],
  );
  return rows as { id: number }[];
}

export async function getMoneyById(id: number | string): Promise<string | undefined> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT money FROM accounts WHERE id = ?',
    [id],
  );
  return rows[0]?.money as string | undefined;
}

export async function findById(id: number | string): Promise<Account | undefined> {
  const [rows] = await pool.query<AccountRow[]>('SELECT * FROM accounts WHERE id = ?', [id]);
  return rows[0];
}

export interface AccountWithUser {
  id: number;
  money: string;
  card: number;
  type: string;
  date: Date | string;
  name: string;
  phone: string;
  userid: number;
  email: string;
}

export async function findWithUserById(id: number | string): Promise<AccountWithUser | undefined> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT accounts.id AS id, accounts.money AS money, accounts.card AS card,
            accounts.type AS type, accounts.date AS date,
            users.name AS name, users.phone AS phone, users.id AS userid, users.email AS email
       FROM users, accounts
      WHERE users.id = accounts.user
        AND accounts.id = ?`,
    [id],
  );
  return rows[0] as AccountWithUser | undefined;
}

export async function save(account: NewAccount): Promise<number> {
  const [result] = await pool.query(
    `INSERT INTO accounts (user, money, card, type, date)
     VALUES (?, ?, ?, ?, ?)`,
    [account.user, account.money ?? 0, account.card ?? 0, account.type, account.date],
  );
  return (result as { insertId: number }).insertId;
}

export async function deposit(id: number | string, money: number | string): Promise<void> {
  await pool.query('UPDATE accounts SET money = money + ? WHERE id = ?', [money, id]);
}

export async function withdraw(id: number | string, money: number | string): Promise<void> {
  await pool.query('UPDATE accounts SET money = money - ? WHERE id = ?', [money, id]);
}

export async function transfer(
  from: number | string,
  to: number | string,
  money: number | string,
): Promise<void> {
  // Two single-statement updates; multipleStatements is intentionally off.
  // Atomic transaction wrap lands in Phase 2.
  await withdraw(from, money);
  await deposit(to, money);
}

export async function hasEnoughFunds(
  id: number | string,
  money: number | string,
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT (accounts.money - ?) >= 0 AS available FROM accounts WHERE accounts.id = ?',
    [money, id],
  );
  return Boolean(rows[0]?.available);
}

export async function hasEnoughFundsForCard(
  cardId: number | string,
  money: number | string,
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT (accounts.money - ?) >= 0 AS available
       FROM accounts, cards
      WHERE cards.account = accounts.id AND cards.id = ?`,
    [money, cardId],
  );
  return Boolean(rows[0]?.available);
}

export async function moneyTotal(user: number): Promise<string> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COALESCE(SUM(money), 0) AS sum FROM accounts WHERE user = ?',
    [user],
  );
  return String(rows[0].sum);
}

export async function toggleCardState(id: number | string): Promise<void> {
  await pool.query('UPDATE accounts SET card = IF(card = 1, 0, 1) WHERE id = ?', [id]);
}

export async function getCardState(id: number | string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT card FROM accounts WHERE id = ?', [id]);
  return Number(rows[0]?.card ?? 0);
}

export async function updateType(id: number | string, type: string): Promise<void> {
  await pool.query('UPDATE accounts SET type = ? WHERE id = ?', [type, id]);
}

export async function deleteById(id: number | string): Promise<void> {
  await pool.query('DELETE FROM accounts WHERE id = ?', [id]);
}
