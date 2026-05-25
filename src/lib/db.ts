import mysql, { Pool, PoolOptions } from 'mysql2/promise';

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
