import bcrypt from 'bcryptjs';
import { query } from '../db/client';

async function main() {
  const orgName = 'Default Org';
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  const orgRes = await query<{ id: string }>(
    `INSERT INTO organizations(name) VALUES($1) ON CONFLICT DO NOTHING RETURNING id`,
    [orgName]
  );
  let orgId = orgRes.rows[0]?.id;
  if (!orgId) {
    const fetchOrg = await query<{ id: string }>(`SELECT id FROM organizations WHERE name=$1`, [orgName]);
    orgId = fetchOrg.rows[0].id;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await query(
    `INSERT INTO users(org_id, email, password_hash, role) VALUES($1,$2,$3,'admin') ON CONFLICT (email) DO NOTHING`,
    [orgId, adminEmail, passwordHash]
  );

  // eslint-disable-next-line no-console
  console.log('Seed completed. Admin:', adminEmail, 'password:', adminPassword);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


