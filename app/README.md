# Thrift Store Directory (MVP)

Next.js + Prisma app for a San Diego County thrift store directory with:

- Public browse/search/filter directory
- Store detail pages
- Community store submissions (moderated)
- Admin moderation queue (approve / reject / mark duplicate)
- Store reviews with anti-spam rate limiting
- Fallback seed data when the database is offline (read paths only)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma + PostgreSQL
- React 18

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Copy env file and fill required values

```bash
cp .env.example .env
```

Required for full MVP behavior:

- `DATABASE_URL`
- `ADMIN_ACCESS_KEY`
- `REQUEST_FINGERPRINT_SALT`

3. Run Prisma migration(s)

```bash
npm run prisma:migrate:dev -- --name init
```

If the DB already exists and migrations are in the repo, use normal Prisma migrate commands as appropriate for your environment.

4. Seed starter data

```bash
npm run db:seed
```

5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Admin Moderation (MVP)

1. Open `/admin/store-submissions`
2. Enter the `ADMIN_ACCESS_KEY`
3. The app creates an HttpOnly admin session cookie
4. Review pending submissions and approve / reject / mark duplicate

## Public Flows to Test

1. Directory search/filter on `/`
2. Store detail page `/stores/[slug]`
3. Submit store on `/submit-store`
4. Approve submission in admin
5. Confirm approved store appears in directory and detail page
6. Add a review on a store detail page

## Security / Abuse Controls Included (MVP)

- Admin key is stored in an HttpOnly session cookie (no URL query required)
- Admin API endpoints require admin auth
- Submission API rate limiting (IP-based, in-memory)
- Reviews API rate limiting (IP-based, in-memory)
- Honeypot fields on public forms
- Review duplicate suppression (fingerprint-based, 24h window)
- Input validation for URL, ZIP, state, lat/lng

## Notes

- The app uses seed-data fallback for directory reads if Postgres is unavailable.
- Writes (submissions, reviews, admin moderation) require a working database.
- `next build` may log Prisma connection errors during static generation if Postgres is offline, but the build still completes because read paths fall back to seed data.

## Useful Commands

```bash
npm run lint
npm run build
npm run prisma:generate
npm run db:seed
```
