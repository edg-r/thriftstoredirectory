# ThriftStoreDirectory

MVP thrift store directory for San Diego County, built as a responsive web app first and structured to support a future iOS client using the same backend/API.

## MVP Goals

- Help users find thrift stores in San Diego County.
- Filter/sort by category, price tier, open now, and location.
- Show store details, reviews, and user-uploaded photos.
- Allow authenticated users to post reviews/photos (Google Sign-In).
- Provide basic admin tools for metadata editing, imports, and moderation.

## Scope

### In Scope (MVP)

- San Diego County directory only
- Search, filters, sort
- Store detail pages
- Google Sign-In auth
- Reviews (1-5 stars + text)
- Review photo uploads
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

- Submit review (rating + text + photos)
- Report review/photo
- Edit/delete own review (recommended if time allows)

### Admin

- Store import trigger and import status
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

- `POST /api/reviews`
- `PATCH /api/reviews/:id` (recommended)
- `DELETE /api/reviews/:id` (recommended)
- `POST /api/reviews/:id/photos`
- `POST /api/reports`

### Admin

- `PATCH /api/admin/stores/:id`
- `POST /api/admin/import-stores`
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
- Optional: `userFavorites`

## Import Pipeline Notes

- Build provider-agnostic import normalization (do not couple app logic to scraping Google Maps HTML).
- Import seed fields: name, address, lat/lng, opening hours, phone, website, external source id.
- Use upsert logic to reduce duplicates.
- Allow manual enrichment after import (categories, price tier, notes).

## Functional / Non-Functional Requirements (Summary)

- Combinable filters and useful empty states
- Open-now logic and hours display
- Hidden content excluded from public views
- Image-only uploads with file size limits (target 5-10 MB)
- Mobile-friendly responsive UI
- Basic accessibility (labels, keyboard support, alt text handling)
- Error handling for uploads/imports

## Local Development (Planned)

Project scaffolding is not created yet. Once implemented, this README should include:

- Prerequisites (Node.js, package manager, PostgreSQL)
- Install steps
- Environment variables
- Prisma migrations and seed commands
- Local run commands
- Import pipeline commands
- Deployment steps

## Initial Environment Variables (Expected)

Exact names may change during implementation, but expect values for:

- Database connection (`DATABASE_URL`)
- Auth secret (`AUTH_SECRET` / `NEXTAUTH_SECRET`)
- Google OAuth client id/secret
- App URL (`NEXTAUTH_URL` or equivalent)
- Storage provider credentials (Supabase or Cloudinary)
- Optional admin allowlist / role configuration

## Build Order

1. Foundation: scaffold app, Prisma/Postgres, schema, migrations, categories seed, Google auth
2. Directory core: list/detail APIs, directory UI, filters/sort, open-now logic
3. Community: reviews, photo uploads, gallery
4. Admin: metadata editing, import integration, moderation queue/actions
5. Cleanup: validation, error states, docs/setup polish
