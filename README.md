## Lead Management System (Express + PostgreSQL on Vercel)

Backend for Admin/User dashboards: CSV upload, lead assignment, activity tracking, analytics, user panel, and automated follow-ups with hourly cron.

### Tech
- Node.js + Express
- PostgreSQL (works with Vercel Postgres/Neon)
- TypeScript
- JWT Auth (admin, user)
- Vercel serverless functions + cron

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: secret for signing JWTs

Set these in a local `.env` and in Vercel Project Settings → Environment Variables.

### Install
```bash
npm install
```

### Build
```bash
npm run build
```

### Local Dev
Option 1: Node server
```bash
cp .env.example .env # create and fill manually if needed
export $(grep -v '^#' .env | xargs) 2>/dev/null || true
npm run build
node dist/server.js
# http://localhost:3000/api/health
```

Option 2: Vercel dev
```bash
vercel dev
```

### Database Setup
Run migrations and seed (uses `DATABASE_URL`).
```bash
export DATABASE_URL="postgres://..." # your connection
npx ts-node src/scripts/migrate.ts
npx ts-node src/scripts/seed.ts
```

The seed creates an organization and an admin user:
- email: `admin@example.com`
- password: `admin123`

### Auth
POST `/api/auth/login` with `{ email, password }` → returns `{ token, role }`.
Use `Authorization: Bearer <token>` in subsequent requests.

### Admin Endpoints
- POST `/api/admin/upload-csv` multipart field `file`: first_name,last_name,email,phone,source
- POST `/api/admin/assign` JSON `{ userId, leadIds: [] }`
- GET `/api/admin/activity-summary`
- GET `/api/admin/reports`
- POST `/api/admin/users` JSON `{ email, password, role }`

### User Endpoints
- GET `/api/user/leads`
- POST `/api/user/leads/:id/status` JSON `{ status }`
- POST `/api/user/leads/:id/notes` JSON `{ note }`
- POST `/api/user/leads/:id/follow-ups` JSON `{ followUpAt }` (ISO)
- POST `/api/user/leads/:id/follow-ups/:activityId/complete`

### Automation
- POST `/api/automation/templates` `{ channel, name, subject?, body }`
- POST `/api/automation/sequences` `{ name, steps: [{ offset_days, channel, template_id }, ...] }`
- POST `/api/automation/enroll` `{ leadId, sequenceId }`

Cron: `GET /api/cron/automation` runs hourly on Vercel (see `vercel.json`). It advances due steps and logs `outbound_messages` as sent (simulate send).

### Deploy to Vercel
1) Create project
```bash
vercel
```
2) Set env vars in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
3) Trigger a deploy
4) Run migrations against production DB from local:
```bash
DATABASE_URL="<vercel-db-conn>" npx ts-node src/scripts/migrate.ts
DATABASE_URL="<vercel-db-conn>" npx ts-node src/scripts/seed.ts
```

### Notes
- CSV files larger than ~5–10MB may exceed serverless limits; split if needed.
- This repo uses `gen_random_uuid()` requiring `pgcrypto` (enabled in migrations). On Neon/Vercel Postgres this is supported.


