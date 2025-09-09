import dotenv from 'dotenv';
dotenv.config();

export const env = {
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  vercelPostgresUrl: process.env.POSTGRES_URL || process.env.DATABASE_URL || '',
};

if (!env.vercelPostgresUrl) {
  // Log only; on Vercel, envs must be configured in dashboard
  // eslint-disable-next-line no-console
  console.warn('DATABASE_URL/POSTGRES_URL is not set. DB operations will fail.');
}


