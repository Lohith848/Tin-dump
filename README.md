# Crate — A Minimal Tin Collection

Crate is a minimal, premium web application designed as an open canvas to showcase a collection of drink tins. It abandons traditional web layouts (no navbars, no hero sections, no footers, no grids) in favor of a freeform, scrollable space where tins can be placed anywhere.

## Features

- **Open Canvas Layout**: Place your tins anywhere on an infinite-feeling canvas. Tins can be dragged and repositioned freely.
- **Premium Aesthetics**: Built with a curated color palette (stone `#f1f0eb` background, deep bottle green `#28453a` accents) and modern typography (Bricolage Grotesque, Inter, IBM Plex Mono).
- **Floating Action Button (FAB)**: A single `+` button handles searching the catalog, adding new tins, and uploading photos.
- **In-Browser Image Cropping**: When adding a new tin, users can pan and zoom their uploaded photo to crop it perfectly before it saves to the database.
- **Silent Anonymous Authentication**: No signup forms or passwords. The app uses Supabase's anonymous sign-ins to seamlessly give every user their own isolated collection canvas.
- **Optimistic UI Updates**: Tins appear on the board instantly when added or moved, without waiting for database confirmation.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS (`globals.css`)
- **Database & Auth**: Supabase (Postgres, Row Level Security, Anonymous Auth, Storage)
- **Icons**: Lucide React

## Setup Instructions

### 1. Supabase Project Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and run the contents of `supabase-schema.sql` to create the required tables (`tin_catalog`, `user_tins`) and Row Level Security (RLS) policies.
3. Go to **Authentication -> Providers** and enable **Anonymous Sign-Ins**.

### 2. Storage Bucket Configuration

1. In Supabase, go to **Storage** and create a new bucket named exactly **`tin-photos`**.
2. **Crucial:** Make sure the **"Public bucket"** toggle is enabled so images can load in the browser.
3. Your bucket should now have the policies created by the SQL schema allowing uploads and public reads.

### 3. Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials (found in Project Settings -> API):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Running the App

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your collection canvas.

### 5. Seeding Data (Optional)

If you have a set of starting images you want to populate into the global catalog:
1. Ensure the images are available in an `assests/` folder.
2. Ensure your `tin-photos` bucket is public.
3. Run `node scripts/seed.mjs` to upload the images and add them to the database.
4. If you manually uploaded the images to the bucket already, you can use `node scripts/seed-db-only.mjs` to populate just the database catalog.

## Project Structure

- `/app`: Next.js App Router files, layout, and main page.
- `/app/components`: Reusable UI components (`Canvas`, `Fab`, `CropTool`, `TinCard`, etc.)
- `/lib`: Supabase client initialization and custom React hooks (`useCatalog`, `useTins`) for data fetching.
- `/scripts`: Utility scripts for seeding initial data into Supabase.
