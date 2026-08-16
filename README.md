# Tin Dump.

Tin Dump is a polished, minimal web app for curating and arranging a personal collection of drink tins on a freeform canvas. The experience is intentionally simple and immersive: visitors can browse a shared catalog, add tins to their own board, drag them into place, and manage counts without any traditional dashboard UI.

## What this project does

This app combines a visual canvas experience with a lightweight backend powered by Supabase. Users get an anonymous session automatically, allowing them to start building their collection immediately. Tins can be:

- added from an existing catalog
- uploaded as new entries with in-browser cropping
- repositioned freely on the board
- incremented or removed from the personal collection

## Key features

- Freeform canvas layout with draggable tin cards
- Floating action button for catalog browsing and new tin creation
- In-browser image cropping and upload flow
- Anonymous authentication with per-user isolation
- Optimistic UI updates for movement and collection changes
- Shared catalog support for reusable tin entries

## Tech stack

- Next.js 16 (App Router)
- React 19
- Supabase for authentication, Postgres, storage, and row-level security
- Vanilla CSS for styling

## Project structure

- app/ — application entry point and UI components
  - app/page.js — main app entry
  - app/components/ — canvas, FAB, crop tool, card, and popover UI
- lib/ — Supabase client and data hooks
  - lib/supabase.js — shared Supabase browser client
  - lib/useTins.js — user board state and mutations
  - lib/useCatalog.js — shared tin catalog queries and uploads
- scripts/ — helper scripts for data seeding and validation
- supabase-schema.sql — database schema, indexes, and RLS policies

## Prerequisites

Before running the app locally, make sure you have:

- Node.js 18 or newer
- npm
- A Supabase project

## Supabase setup

1. Create a new project in Supabase.
2. Open the SQL Editor and run the contents of supabase-schema.sql.
3. Enable Anonymous Sign-ins in Authentication > Providers.
4. Create a storage bucket named tin-photos and mark it as public.
5. Ensure the bucket policies allow authenticated uploads and public reads.

## Environment variables

Create a .env.local file in the project root with the following values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Local development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## Data model

The app uses two main database tables:

- tin_catalog — shared list of known tins with a name and photo URL
- user_tins — each user’s placed tins, including position, count, and link to the catalog entry

Images are stored in the Supabase Storage bucket tin-photos.

## Seeding data (optional)

If you want to preload a catalog from local image assets:

```bash
node scripts/seed.mjs
```

If the images already exist in storage and you only want to populate the database catalog, use:

```bash
node scripts/seed-db-only.mjs
```

## Author 

A random idea by Lohith G.
