# MVP Spec — San Diego County Thrift Store Directory (Web-First, iOS-Ready)

## Project Summary

Build an **MVP thrift store directory** focused on **San Diego County** as a **responsive web app** (mobile-first), designed so it can later support an iOS app using the same backend/API.

The product helps users discover thrift stores and sort/filter by:
- price tier
- type of goods (e.g., vintage clothes, furniture, accessories)
- whether stores are open now
- location/distance

Users should also be able to:
- sign in with Google
- leave reviews
- upload photos of purchases/finds

Branding and UI polish are **not** part of the MVP priority. Focus on functionality, data model, ingestion, filtering, and basic moderation.

---

## MVP Scope (San Diego County Only)

### In Scope
- San Diego County thrift store directory
- Store search/filter/sort
- Store detail pages
- Google Sign-In authentication
- Reviews (1–5 stars + text)
- User photo uploads attached to reviews
- Manual moderation for photos/reviews
- Admin editing for categories and price tiers
- Seed import pipeline for store location/name/hours data

### Out of Scope (for now)
- Native iOS app (build web-first, iOS-ready backend)
- Advanced branding / UI animations
- Recommendation engine
- Social feeds / follows / messaging
- Automated moderation
- Nationwide launch
- Full marketplace or resale listings

---

## Product Goals

The MVP should let a user:
1. Find thrift stores in San Diego County.
2. Filter by what they are shopping for (vintage clothes, furniture, accessories, etc.).
3. Quickly understand store price tier and hours.
4. Read reviews and see user-uploaded photos.
5. Contribute their own reviews/photos after signing in.

The MVP should let an admin:
1. Import and maintain store records.
2. Assign categories/tags and price tiers.
3. Manually moderate flagged content.

---

## Recommended Tech Stack (AI-Agent Friendly)

This stack is chosen because it is fast to scaffold, well-documented, and works well with AI coding agents.

### Preferred Stack
- **Frontend:** Next.js (React, App Router) — responsive web app
- **Backend/API:** Next.js API routes (or Route Handlers)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** Google Sign-In (NextAuth/Auth.js with Google provider)
- **Image Storage:** Supabase Storage or Cloudinary (either is acceptable)
- **Hosting:** Vercel (frontend/app) + Neon/Supabase/Postgres host

### Why this stack
- AI coding agents perform well with Next.js + Prisma patterns
- One codebase for frontend + API speeds iteration
- Easy deployment and future handoff
- Can later support a native iOS client using the same API

---

## Core User Features (MVP)

### 1) Directory Browse Page (Required)
Users can browse all thrift stores in San Diego County.

Each store card/list item should show:
- Store name
- Address (or neighborhood/city)
- Opening status (Open now / Closed)
- Price tier (budget / mid / premium / unknown)
- Category tags (top few)
- Average rating (if available)
- Review count

### 2) Search, Filter, and Sort (Required)
This is the main value of the product.

#### Filters
- **Category / goods type**
  - vintage clothes
  - furniture
  - accessories
  - shoes
  - home goods
  - books
  - electronics
  - designer items
  - other (extensible)
- **Price tier**
  - budget
  - mid
  - premium
  - unknown
- **Open now**
- **Location radius** (if user shares location)
- **City/ZIP within San Diego County** (fallback when no geolocation)

#### Sorting
- Distance (if geolocation provided)
- Highest rated
- Most reviewed
- Recently added

### 3) Store Detail Page (Required)
Each store should have a dedicated page showing:

#### Store info
- Name
- Address
- Map link / coordinates
- Phone (if available)
- Website (if available)
- Opening hours
- Open now indicator
- Price tier
- Categories/tags

#### Community content
- Average rating + review count
- Review list
- User photo gallery (from reviews)
- “Write a review” CTA (if signed in)

### 4) Authentication (Required)
Users can sign in using:
- **Google Sign-In**

Guests can browse and view content, but cannot post reviews/photos.

### 5) Reviews + Photos (Required)
Authenticated users can:
- Leave a 1–5 star rating
- Write a short review
- Upload one or more photos for the review
- Edit/delete their own review (optional if time allows; strongly recommended)
- Report inappropriate content

---

## Admin Features (MVP)

Build a basic internal admin panel/page (simple UI is fine).

Admin can:
- Import store seed data
- Edit store metadata
- Assign categories/tags
- Assign/update price tier
- Review flagged photos/reviews
- Hide/restore content
- Deactivate duplicate or invalid stores

Manual moderation is sufficient for MVP.

---

## Data Ingestion Strategy (Seed Data)

### Important Implementation Constraint
Do **not** build the system around brittle scraping of Google Maps HTML pages.

Instead, build a **provider-agnostic import pipeline** so the source can be swapped later. The ingestion layer should normalize store data into the app’s own schema.

### Seed import data needed
- Store name
- Address
- Latitude/longitude
- Opening hours
- Phone (if available)
- Website (if available)
- External source ID (if available)

### Initial San Diego County rollout
Seed stores across San Diego County cities/areas (examples):
- San Diego
- La Jolla
- North Park
- Hillcrest
- Chula Vista
- National City
- El Cajon
- Oceanside
- Escondido
- Carlsbad
- Encinitas
- Vista
- San Marcos
- Clairemont / Kearny Mesa / etc.

> The exact sourcing method can be implemented by the AI agent, but the app architecture should treat imported data as external seed data that can be refreshed and enriched manually.

### Enrichment workflow (manual, MVP)
After import, admin manually sets:
- category tags
- price tier
- optional notes

This is the fastest realistic way to reach a high-quality MVP.

---

## Data Model (MVP Schema)

Use PostgreSQL + Prisma. Keep schema normalized and extensible.

### `stores`
Core directory record.

Suggested fields:
- `id` (UUID)
- `name`
- `slug`
- `addressLine1`
- `city`
- `state`
- `zipCode`
- `latitude`
- `longitude`
- `phone`
- `websiteUrl`
- `openingHoursJson` (JSON)
- `externalPlaceId` (nullable)
- `sourceProvider` (nullable)
- `priceTier` (enum: `BUDGET`, `MID`, `PREMIUM`, `UNKNOWN`)
- `isActive` (boolean)
- `createdAt`
- `updatedAt`

### `categories`
Master list for goods types.

Suggested fields:
- `id`
- `name`
- `slug`
- `createdAt`

Seed examples:
- Vintage Clothes
- Furniture
- Accessories
- Shoes
- Home Goods
- Books
- Electronics
- Designer Items

### `storeCategories`
Join table (many-to-many)
- `storeId`
- `categoryId`

### `users`
Auth-linked user table (Google Sign-In)
- `id`
- `name`
- `email` (unique)
- `image` (profile image URL, nullable)
- `createdAt`
- `updatedAt`

### `reviews`
- `id`
- `storeId`
- `userId`
- `rating` (int 1–5)
- `reviewText`
- `status` (enum: `PUBLISHED`, `FLAGGED`, `HIDDEN`)
- `createdAt`
- `updatedAt`

### `reviewPhotos`
- `id`
- `reviewId`
- `userId`
- `imageUrl`
- `caption` (nullable)
- `status` (enum: `PUBLISHED`, `FLAGGED`, `HIDDEN`)
- `createdAt`

### `contentReports` (recommended MVP table)
Tracks reports for moderation.
- `id`
- `reporterUserId`
- `targetType` (enum: `REVIEW`, `PHOTO`)
- `targetId`
- `reason` (nullable short text)
- `status` (enum: `OPEN`, `RESOLVED`, `DISMISSED`)
- `createdAt`
- `resolvedAt` (nullable)

### `userFavorites` (optional, nice-to-have)
- `userId`
- `storeId`
- `createdAt`

---

## Required Pages / Screens (MVP)

### Public
1. **Directory / Home page**
   - Search bar
   - Filters
   - Sort dropdown
   - Store list/cards
   - Pagination or infinite scroll

2. **Store detail page**
   - Store metadata
   - Opening hours
   - Categories
   - Price tier
   - Reviews
   - Photo gallery
   - Add review button

3. **Sign-in page**
   - Google Sign-In only (MVP)

### Authenticated User
4. **Submit review flow**
   - Star rating
   - Review text
   - Photo upload(s)
   - Submit button
   - Basic validation

5. **Edit own review (recommended if time allows)**
   - Edit text/rating
   - Add/remove photos (optional)

### Admin (simple internal)
6. **Admin dashboard**
   - Store list/search
   - Edit categories and price tier
   - Import trigger / import status
   - Moderation queue (flagged items)

---

## API Requirements (MVP)

Use REST endpoints (faster for MVP than GraphQL).

### Public endpoints
- `GET /api/stores`
  - Supports query params:
    - `q` (search text)
    - `category` (slug or id)
    - `priceTier`
    - `openNow=true|false`
    - `lat`
    - `lng`
    - `radius`
    - `city`
    - `zip`
    - `sort=distance|rating|reviews|newest`
    - `page`
    - `limit`

- `GET /api/stores/:id`
- `GET /api/stores/:id/reviews`
- `GET /api/categories`

### Authenticated endpoints
- `POST /api/reviews`
- `PATCH /api/reviews/:id` (optional but recommended)
- `DELETE /api/reviews/:id` (optional but recommended)
- `POST /api/reviews/:id/photos`
- `POST /api/reports`

### Admin-only endpoints
- `PATCH /api/admin/stores/:id`
- `POST /api/admin/import-stores`
- `GET /api/admin/moderation`
- `PATCH /api/admin/moderation/:targetType/:targetId`

---

## Functional Requirements (Detailed)

### Directory filtering behavior
- Filters should be combinable (e.g., `furniture + budget + open now`)
- Results should update quickly
- If geolocation is denied, app should still work with city/ZIP filters
- Display helpful empty states (e.g., “No stores match these filters”)

### Price tier
Price tier is **internal app metadata** (not dependent on third-party source).
Allowed values:
- Budget
- Mid
- Premium
- Unknown

### Categories / tags
Stores can have multiple categories.
Users should be able to filter by at least one category; multi-select filtering is preferred.

### Reviews
- One user should only have one active review per store (recommended)
- Average rating and review count should be computed efficiently
- Hidden reviews/photos should not appear publicly

### Photo uploads
- Accept images only
- Enforce file size limit (e.g., 5–10 MB each)
- Basic compression/resizing is a plus
- Store URLs in DB, files in object storage

---

## Moderation Policy (MVP)

### Policy Choice
- **Manual moderation only** for now

### Required moderation features
- User can report review/photo
- Reported content marked/queued for admin review
- Admin can:
  - Hide content
  - Restore content
  - Dismiss report
- Public UI should not display hidden content

### Nice-to-have (if easy)
- Rate limiting for review/photo submissions
- Basic profanity filter on review text

---

## San Diego County Rollout Notes (MVP)

### Geographic scope
MVP should be constrained to **San Diego County only**. Do not overbuild for multi-city support in the UI, but keep the schema flexible so expansion is easy later.

### Practical UX defaults
- Default region context: San Diego County
- City quick filters (optional): San Diego, Chula Vista, Oceanside, Escondido, El Cajon, etc.
- ZIP filtering supported
- Distance sorting when user geolocation is available

---

## Non-Functional Requirements

- Mobile-friendly responsive design
- Basic accessibility (labels, keyboard support, alt text support for uploads)
- Reasonable performance for directory browsing
- Error handling for failed uploads/imports
- Environment variables documented in README
- Easy local setup for future iteration

---

## Deliverables for the AI Coding Agent

The AI agent should produce:

1. **Project scaffold**
   - Next.js app
   - Prisma schema
   - Auth configuration (Google Sign-In)
   - Storage integration (for photos)

2. **Database schema + migrations**
   - All core MVP tables and enums
   - Seed categories

3. **API routes**
   - Public, authenticated, and admin endpoints listed above

4. **UI pages**
   - Directory page
   - Store detail page
   - Sign-in page
   - Review submission flow
   - Basic admin panel

5. **Seed import pipeline**
   - Script/job to import initial San Diego County stores
   - Upsert logic to avoid duplicates
   - Documentation for running imports

6. **README**
   - Setup instructions
   - Environment variables
   - How to run migrations/seeds
   - How to run locally
   - How to deploy

---

## Build Order (Strongly Recommended)

To avoid scope creep, build in this order:

### Phase 1 — Foundation
- Scaffold Next.js app
- Set up Prisma + PostgreSQL
- Define schema + migrations
- Seed categories
- Set up Google Sign-In auth

### Phase 2 — Directory Core
- Build `GET /stores` and `GET /stores/:id`
- Directory page + filters/sort
- Store detail page
- Opening hours display + open now logic

### Phase 3 — Community Features
- Reviews API + UI
- Photo upload pipeline + gallery
- Review/photo display

### Phase 4 — Admin + Moderation
- Admin store editing (categories, price tier)
- Import trigger and import script integration
- Moderation queue and hide/restore actions

### Phase 5 — Cleanup
- Validation
- Error states
- README and local setup polish

---

## AI Agent Prompt (Copy/Paste Ready)

Use the following as the direct implementation prompt for an AI coding agent:

```text
Build an MVP thrift store directory focused on San Diego County as a responsive web app (mobile-first) using a tech stack that is reliable for AI-assisted development.

Requirements:
- Web-first app, iOS-ready backend/API for future native app support
- Next.js (React) + PostgreSQL + Prisma
- Google Sign-In authentication (NextAuth/Auth.js)
- Image uploads for review photos using Supabase Storage or Cloudinary
- Manual moderation for reviews/photos
- San Diego County only for MVP

Core features:
1) Directory page with search, filters, and sorting
2) Store detail page with hours, address, categories, price tier, reviews, and user photos
3) Google Sign-In auth
4) Authenticated users can post reviews (1-5 stars + text) and upload photos
5) Admin panel to edit store categories/price tier and moderate flagged content
6) Seed import pipeline for store data (name, location, opening hours, etc.) with provider-agnostic normalization and upsert logic

Filters:
- category/goods type
- price tier
- open now
- city/zip
- radius (if lat/lng provided)

Sorting:
- distance
- highest rated
- most reviewed
- newest

Database tables (minimum):
- stores
- categories
- storeCategories
- users
- reviews
- reviewPhotos
- contentReports
Optional:
- userFavorites

API endpoints (minimum):
- GET /api/stores
- GET /api/stores/:id
- GET /api/stores/:id/reviews
- GET /api/categories
- POST /api/reviews
- POST /api/reviews/:id/photos
- POST /api/reports
- PATCH /api/admin/stores/:id
- POST /api/admin/import-stores
- GET /api/admin/moderation
- PATCH /api/admin/moderation/:targetType/:targetId

Implementation priorities:
- Functionality over visual polish
- Clean responsive UI
- Modular codebase
- Production-ready enough for iteration
- README with full setup and deployment instructions

Build in phases:
1. Scaffold + schema + auth
2. Directory browsing + filtering + store detail
3. Reviews + photo uploads
4. Admin editing + moderation + import pipeline
5. Cleanup/documentation
```

---

## Future Phases (Not for MVP Build)

After MVP validation, possible next steps:
- Branding/UI polish
- Native iOS app (SwiftUI or React Native/Expo) using same API
- Saved favorites and user profiles
- Tag recommendations
- Store verification / owner accounts
- Expanded Southern California regions
- Monetization (ads/sponsored listings/affiliate integrations where appropriate)

---

## Notes for the AI Agent

- Prioritize a working, testable MVP over perfect UI.
- Keep business logic separate from UI components.
- Do not hardcode San Diego-specific assumptions in the schema (only in seed/import defaults and UI defaults).
- Design import pipeline so the external data provider can be swapped later without changing the core app schema.
