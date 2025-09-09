import { readFileSync } from 'fs';
import { resolve } from 'path';
import { query } from '../db/client';

async function main() {
  const sqlPath = resolve(__dirname, '../db/schema.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  await query(sql);
  // eslint-disable-next-line no-console
  console.log('Migration completed');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


