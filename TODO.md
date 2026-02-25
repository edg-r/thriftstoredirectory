# TODO - MVP Implementation Plan

Derived from `/Users/edgar/Downloads/sd_thrift_directory_mvp_spec.md`.

## Phase 1 - Foundation

- [ ] Initialize Next.js app (App Router, TypeScript)
- [ ] Set up linting/formatting baseline
- [ ] Configure PostgreSQL connection
- [ ] Add Prisma and define initial schema
- [ ] Create enums (`priceTier`, review/photo/report statuses, report target type)
- [ ] Create tables: `stores`, `categories`, `storeCategories`, `users`, `reviews`, `reviewPhotos`, `contentReports`
- [ ] Add `storeSubmissions` table (or moderated store-create workflow on `stores`)
- [ ] Run initial migration
- [ ] Seed categories (vintage clothes, furniture, accessories, shoes, home goods, books, electronics, designer items)
- [ ] Set up Google Sign-In (NextAuth/Auth.js)
- [ ] Add auth session handling and protected route utilities
- [ ] Document env vars in `README.md`

## Phase 2 - Directory Core

- [ ] Build `GET /api/categories`
- [ ] Build `GET /api/stores` with query params (`q`, `category`, `priceTier`, `openNow`, `lat`, `lng`, `radius`, `city`, `zip`, `sort`, `page`, `limit`)
- [ ] Build `GET /api/stores/:id`
- [ ] Build `GET /api/stores/:id/reviews` (public-safe filtering only)
- [ ] Implement rating/review aggregate queries (avg rating + review count)
- [ ] Implement "open now" logic from stored hours JSON
- [ ] Build directory page UI (search, filters, sort, list/cards)
- [ ] Add pagination or infinite scroll
- [ ] Build store detail page (metadata, hours, categories, price tier)
- [ ] Add review list and photo gallery display on store detail
- [ ] Add empty states and error states for filters/search
- [ ] Add geolocation-based distance sorting fallback to city/ZIP
- [ ] Define duplicate detection strategy for future user-submitted stores (name/address proximity)

## Phase 3 - Community Features

- [ ] Build user store submission flow (authenticated)
- [ ] Build `POST /api/store-submissions` (or moderated `POST /api/stores`)
- [ ] Validate submitted store fields (minimum: name + address/location)
- [ ] Prevent obvious duplicate submissions (basic fuzzy name/address check)
- [ ] Add UI for users to submit a new store they discovered
- [ ] Show pending/approved state messaging to submitter (recommended)
- [ ] Build `POST /api/reviews`
- [ ] Enforce one active review per user per store (recommended constraint)
- [ ] Build `PATCH /api/reviews/:id` (recommended)
- [ ] Build `DELETE /api/reviews/:id` (recommended)
- [ ] Integrate image storage provider (Supabase Storage or Cloudinary)
- [ ] Build `POST /api/reviews/:id/photos`
- [ ] Restrict uploads to images and enforce size limits (5-10 MB)
- [ ] Add basic upload validation and error handling
- [ ] Build review submission UI (rating, text, photos)
- [ ] Build sign-in page (Google only)
- [ ] Hide submission actions for guests, keep browsing public
- [ ] Build `POST /api/reports`
- [ ] Add "Report" actions for reviews/photos

## Phase 4 - Admin + Moderation

- [ ] Add admin access control (simple internal role/allowlist)
- [ ] Build admin dashboard page
- [ ] Build store list/search in admin
- [ ] Build review queue for user-submitted stores (approve/reject/merge duplicate)
- [ ] Build `GET /api/admin/store-submissions`
- [ ] Build `PATCH /api/admin/store-submissions/:id` (approve/reject/merge)
- [ ] Build admin edit flow for categories and price tier
- [ ] Build `PATCH /api/admin/stores/:id`
- [ ] Build moderation queue UI for flagged reviews/photos
- [ ] Build `GET /api/admin/moderation`
- [ ] Build `PATCH /api/admin/moderation/:targetType/:targetId` (hide/restore/dismiss)
- [ ] Ensure hidden reviews/photos are excluded from public APIs/UI
- [ ] Build import pipeline normalization layer (provider-agnostic)
- [ ] Build import upsert logic for stores
- [ ] Build `POST /api/admin/import-stores` trigger/integration
- [ ] Add import status/error logging for debugging
- [ ] Ensure import pipeline supports curated CSV/JSON seeds (not provider-specific only)

## Phase 5 - Cleanup + Documentation

- [ ] Add request validation (API inputs)
- [ ] Add server-side error handling and consistent API error responses
- [ ] Add basic rate limiting for review/photo submissions (nice-to-have)
- [ ] Add basic profanity filter (nice-to-have)
- [ ] Improve accessibility (labels, keyboard support, alt text prompts)
- [ ] Improve responsive/mobile QA
- [ ] Document local setup, migrations, seeds, import commands, and deployment in `README.md`
- [ ] Smoke test core flows: browse, filter, detail, sign-in, review, photo upload, moderation
- [ ] Smoke test store submission + admin approval/rejection flow

## Initial Milestone Targets

- [ ] Milestone A: Local scaffold + DB schema + auth works
- [ ] Milestone B: Directory list/detail with filters works
- [ ] Milestone C: Store submissions + reviews + photo uploads work
- [ ] Milestone D: Admin moderation + import pipeline works
- [ ] Milestone E: README/local setup finalized
