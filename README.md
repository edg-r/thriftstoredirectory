# ThriftStoreDirectory

MVP thrift store directory for San Diego County, built as a responsive web app first and structured to support a future iOS client using the same backend/API.

## Current Status (Implemented So Far)

Completed slices currently in the repo:

- Next.js app scaffold (App Router + TypeScript) in `app/`
- PostgreSQL + Prisma schema, initial migration, and seed script
- Seeded categories and sample stores
- Public directory UI with search/filter/sort (category, price tier, sort)
- Public APIs: `GET /api/categories`, `GET /api/stores`, `GET /api/stores/:slug`
- Store detail page (`/stores/:slug`)
- Placeholder reviews API: `GET /api/stores/:slug/reviews`
- User store submission flow (`/submit-store`) + `POST /api/store-submissions`
- Admin store-submission moderation APIs/UI (approve/reject/merge duplicate)
- Placeholder admin access gate (`ADMIN_ACCESS_KEY`) for admin APIs/page

Not implemented yet (major items):

- Google Sign-In / real user auth
- Real reviews persistence + write APIs
- Review photo uploads
- Admin role system (replacing placeholder admin key)
- Import pipeline UI/trigger

## MVP Goals

- Help users find thrift stores in San Diego County.
- Filter/sort by category, price tier, open now, and location.
- Show store details, reviews, and user-uploaded photos.
- Allow authenticated users to post reviews/photos (Google Sign-In).
- Allow authenticated users to submit new thrift stores they find (pending moderation).
- Provide basic admin tools for metadata editing, imports, and moderation.

## Scope

### In Scope (MVP)

- San Diego County directory only
- Search, filters, sort
- Store detail pages
- Google Sign-In auth
- Reviews (1-5 stars + text)
- Review photo uploads
- User-submitted store suggestions (create flow + moderation)
- Manual moderation
- Admin editing for categories and price tiers
- Seed import pipeline for store data

### Out of Scope (for now)

- Native iOS app UI
- Advanced branding / animation polish
- Recommendation engine
- Social features (follows/messages/feed)
- Automated moderation
- Nationwide coverage

## Recommended Stack

- Frontend: Next.js (App Router)
- Backend/API: Next.js Route Handlers / API routes
- Database: PostgreSQL
- ORM: Prisma
- Auth: NextAuth/Auth.js with Google provider
- Image Storage: Supabase Storage or Cloudinary
- Hosting: Vercel + hosted Postgres (Neon/Supabase/etc.)

## Core Product Features (MVP)

### Public

- Directory browse page with search, filters, sorting, and pagination/infinite scroll
- Store detail page with metadata, hours, price tier, categories, reviews, and photo gallery
- Sign-in page (Google only)

### Authenticated User

- Submit a new store listing/suggestion (name, location, optional metadata)
- Submit review (rating + text + photos)
- Report review/photo
- Edit/delete own review (recommended if time allows)

### Admin

- Store import trigger and import status
- Review/approve/reject user-submitted store listings
- Edit store metadata, categories, and price tier
- Moderation queue for flagged reviews/photos
- Hide/restore content and manage invalid/duplicate stores

## Planned API (MVP)

### Public

- `GET /api/stores`
- `GET /api/stores/:id`
- `GET /api/stores/:id/reviews`
- `GET /api/categories`

### Authenticated

- `POST /api/store-submissions` (or `POST /api/stores` with moderation workflow)
- `POST /api/reviews`
- `PATCH /api/reviews/:id` (recommended)
- `DELETE /api/reviews/:id` (recommended)
- `POST /api/reviews/:id/photos`
- `POST /api/reports`

### Admin

- `PATCH /api/admin/stores/:id`
- `POST /api/admin/import-stores`
- `GET /api/admin/store-submissions`
- `PATCH /api/admin/store-submissions/:id`
- `GET /api/admin/moderation`
- `PATCH /api/admin/moderation/:targetType/:targetId`

## Data Model (Planned)

Core tables/enums expected for MVP:

- `stores`
- `categories`
- `storeCategories`
- `users`
- `reviews`
- `reviewPhotos`
- `contentReports`
- `storeSubmissions` (recommended)
- Optional: `userFavorites`

## Import Pipeline Notes

- Build provider-agnostic import normalization (do not couple app logic to scraping Google Maps HTML).
- Import seed fields: name, address, lat/lng, opening hours, phone, website, external source id.
- Use upsert logic to reduce duplicates.
- Allow manual enrichment after import (categories, price tier, notes).
- Treat imported data as a bootstrap source only; first-party curation and user-submitted stores should be primary long-term data growth paths.
- Do not rely on Google Maps/Google Reviews as a required runtime dependency for app data.

## Functional / Non-Functional Requirements (Summary)

- Combinable filters and useful empty states
- Open-now logic and hours display
- Hidden content excluded from public views
- Image-only uploads with file size limits (target 5-10 MB)
- Mobile-friendly responsive UI
- Basic accessibility (labels, keyboard support, alt text handling)
- Error handling for uploads/imports

## Local Development

### Prerequisites

- Node.js 18+ (current local setup tested on Node `18.17.0`)
- npm
- PostgreSQL (local service)

### Install

```bash
cd app
npm install
```

### Environment Variables

Copy the example file and update values as needed:

```bash
cp .env.example .env
```

Important local values:

- `DATABASE_URL` (use your local Postgres user)
- `ADMIN_ACCESS_KEY` (placeholder admin gate for `/admin/store-submissions`)

### Database Setup (Prisma)

Create the local database (example name from `.env.example`):

```bash
createdb thrift_store_directory
```

Run migration and seed:

```bash
npm run prisma:migrate:dev -- --name init
npm run db:seed
```

### Run Locally

```bash
npm run dev
```

Open:

- `http://localhost:3000`
- Admin moderation page (placeholder gate): `http://localhost:3000/admin/store-submissions?adminKey=YOUR_ADMIN_ACCESS_KEY`

### Useful Test Endpoints (Current)

- `GET /api/categories`
- `GET /api/stores`
- `GET /api/stores/:slug`
- `GET /api/stores/:slug/reviews` (placeholder)
- `POST /api/store-submissions`
- `GET /api/admin/store-submissions` (requires admin key header/query)
- `PATCH /api/admin/store-submissions/:id` (requires admin key header/query)

## Initial Environment Variables (Current + Expected)

Current placeholders/config (some used now, some later):

- Database connection (`DATABASE_URL`)
- Auth secret (`AUTH_SECRET` / `NEXTAUTH_SECRET`)
- Google OAuth client id/secret
- App URL (`NEXTAUTH_URL` or equivalent)
- Placeholder admin gate (`ADMIN_ACCESS_KEY`)
- Storage provider credentials (Supabase or Cloudinary)
- Optional admin allowlist / role configuration

## Build Order

1. Foundation: scaffold app, Prisma/Postgres, schema, migrations, categories seed, Google auth
2. Directory core: list/detail APIs, directory UI, filters/sort, open-now logic
3. Community: store submissions, reviews, photo uploads, gallery
4. Admin: metadata editing, submission moderation, import integration, moderation queue/actions
5. Cleanup: validation, error states, docs/setup polish
