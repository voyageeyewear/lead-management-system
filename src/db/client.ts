import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from '../env';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: env.vercelPostgresUrl, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getPool();
  return p.query<T>(text, params as any);
}


