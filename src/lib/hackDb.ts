// src/lib/hackDb.ts
// Server-only Postgres access for the ALATPay demo, via the shared DATABASE_URL
// (the same Supabase Postgres the rest of Plugr_Web uses through `pg`). A direct DB
// connection means full privileges and no PostgREST/RLS gate — and no service-role key
// needed. Only ever touches hack_-prefixed tables.

import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set for the ALATPay demo routes.');
  }
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
  return pool;
}

/** Run a query and return all rows. */
export async function q<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await getPool().query(text, params);
  return res.rows as T[];
}

/** Run a query and return the first row (or null). */
export async function one<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return (rows[0] as T) ?? null;
}
