import { RowDataPacket } from 'mysql2';
import { pool } from '../lib/db';
import { Card, NewCard } from '../types/domain';

type CardRow = Card & RowDataPacket;

export async function countByUser(user: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM cards WHERE user = ?',
    [user],
  );
  return Number(rows[0].total);
}

export async function countByAccount(account: number | string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS total FROM cards WHERE account = ?',
    [account],
  );
  return Number(rows[0].total);
}

export async function getAccountIdById(id: number | string): Promise<number | undefined> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT account FROM cards WHERE id = ?', [id]);
  return rows[0]?.account as number | undefined;
}

export async function getByUser(user: number): Promise<Card[]> {
  const [rows] = await pool.query<CardRow[]>('SELECT * FROM cards WHERE user = ?', [user]);
  return rows;
}

export async function findById(id: number | string): Promise<Card | undefined> {
  const [rows] = await pool.query<CardRow[]>('SELECT * FROM cards WHERE id = ?', [id]);
  return rows[0];
}

export async function save(card: NewCard): Promise<number> {
  const [result] = await pool.query(
    `INSERT INTO cards (date, max, lastuse, type, cardname, user, account)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [card.date, card.max, card.lastuse, card.type, card.cardname, card.user, card.account],
  );
  return (result as { insertId: number }).insertId;
}

export async function useCard(id: number | string, money: number | string): Promise<void> {
  await pool.query(
    `UPDATE accounts
        SET money = money - ?
      WHERE id = (SELECT account FROM cards WHERE id = ?)`,
    [money, id],
  );
}

export interface CardWithUser extends Card {
  address: string;
}

export async function findWithUserById(id: number | string): Promise<CardWithUser | undefined> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM users, cards WHERE users.id = cards.user AND cards.id = ?',
    [id],
  );
  return rows[0] as CardWithUser | undefined;
}

export async function saveDate(date: string, id: number | string): Promise<void> {
  await pool.query('UPDATE cards SET lastuse = ? WHERE id = ?', [date, id]);
}

export async function updateCard(card: Card): Promise<void> {
  await pool.query(
    `UPDATE cards
        SET max = ?, type = ?, account = ?, cardname = ?
      WHERE id = ?`,
    [card.max, card.type, card.account, card.cardname, card.id],
  );
}

export async function deleteById(id: number | string): Promise<void> {
  await pool.query('DELETE FROM cards WHERE id = ?', [id]);
}
