# Instagram Liked/Saved Feed (Local MVP)

Personal web app that recreates an Instagram-like feed **only** from posts you have **liked** or **saved**, using your local Instagram **Download Your Information** JSON export (no Instagram API, no external uploads).

Built with **Next.js 14 (App Router)**, **TypeScript**, **Prisma**, **SQLite**, and **Tailwind CSS**.

## 1. Getting started

### 1.1. Requirements

- Node.js 18+ (recommended LTS)
- npm or pnpm or yarn

### 1.2. Install dependencies

```bash
cd "C:\Users\User\OneDrive\Desktop\New folder"
npm install
```

### 1.3. Configure database

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

`.env`:

```bash
DATABASE_URL="file:./dev.db"
```

Run Prisma generate and create the SQLite file:

```bash
npx prisma generate
npx prisma db push
```

This creates `dev.db` in the project root and syncs the Prisma schema.

### 1.4. Run the dev server

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

### 1.5. Production build and run

```bash
npm run build
npm run start
```

Set `DATABASE_URL` in `.env` (e.g. `file:./dev.db` for SQLite in the `prisma` folder). For production hosting, use a writable path for the SQLite file and run `npx prisma db push` before starting.

### 1.6. Where is my data stored?

- **In this app, imported data is stored in a database (SQLite), not in localStorage.**
- The SQLite file lives at `prisma/dev.db` (when `DATABASE_URL="file:./dev.db"`). The import API parses your JSON and writes rows into this file; the feed and stats read from the same database.

### 1.7. Deploying to Netlify (or other serverless hosts)

On **Netlify**, **Vercel**, etc., the server has **no persistent disk**. A local SQLite file would be lost between requests or deploys, so **imports would not persist** if you keep using `file:./dev.db`.

**Option A – Use a hosted database (recommended)**  
Use a free SQLite-compatible or SQL database so data persists:

1. **Turso** (free tier, SQLite-compatible)
   - Sign up at [turso.tech](https://turso.tech), create a database, and get the connection URL.
   - Install: `npm install @libsql/client`
   - In Prisma, you can use the Turso URL as your datasource (e.g. set `DATABASE_URL` to the Turso libsql URL and use the libsql provider/adapter if required by your Prisma version).
   - In Netlify: add `DATABASE_URL` in **Site settings → Environment variables** and run `npx prisma db push` (or migrations) in the build step.

2. **Neon / Supabase / PlanetScale** (Postgres or MySQL)  
   - Create a free database and set `DATABASE_URL` to the connection string.
   - Change `provider` in `prisma/schema.prisma` to `postgresql` or `mysql` and run `prisma migrate` or `prisma db push`.
   - Add `DATABASE_URL` in Netlify (and run migrations in the build command if needed).

After that, **import works as usual**: users hit your deployed app, upload JSON on the Import page, and data is saved in the hosted DB and shown in the feed.

**Option B – Client-side only (no server DB)**  
You could later change the app to store imported data only in the browser (e.g. localStorage or IndexedDB). That would work on static Netlify with no backend DB, but data would stay on that device/browser and not sync across devices.

---

## 2. Where to find Instagram export JSON files

These files come from Instagram’s **Download Your Information** feature.

### 2.1. Request your data from Instagram

1. Open the Instagram app or website.
2. Go to **Settings & privacy** → **Accounts Center** → **Your information and permissions** → **Download your information**.
3. Choose your Instagram account and request a **JSON** export.
4. Wait for the email, download the `.zip` file, and extract it locally.

### 2.2. Files you care about

Inside the extracted folder (names may vary a bit):

- **Liked posts JSON** – usually something like:
  - `likes/liked_posts.json`
  - or `likes/likes_media_likes.json`
- **Saved posts JSON** – usually:
  - `saved/saved_posts.json`
  - or `saved/saved_saved_media.json`

This app expects the *content* to match exactly what Instagram exports:

#### Liked posts JSON shape

```json
{
  "likes_media_likes": [
    {
      "title": "introvertboiiii",
      "string_list_data": [
        {
          "href": "https://www.instagram.com/reel/DTnDYpviFaf/",
          "value": "👍",
          "timestamp": 1769246225
        }
      ]
    }
  ]
}
```

- iterate `likes_media_likes[]`
- `username = item.title`
- `igUrl = item.string_list_data[0].href`
- `timestampUnix = item.string_list_data[0].timestamp` (seconds)
- `isLiked = true`

#### Saved posts JSON shape

```json
{
  "saved_saved_media": [
    {
      "title": "eren_setup",
      "string_map_data": {
        "Saved on": {
          "href": "https://www.instagram.com/reel/DT2k9-VmJZt/",
          "timestamp": 1769242281
        }
      }
    }
  ]
}
```

- iterate `saved_saved_media[]`
- `username = item.title`
- `entry = item.string_map_data["Saved on"]`
- `igUrl = entry.href`
- `timestampUnix = entry.timestamp` (seconds)
- `isSaved = true`

Only `href` containing `"instagram.com/"` are imported.

---

## 3. App pages & features

### 3.1. Import page – `/import`

- Drag & drop or select **multiple JSON files**.
- Accepts:
  - Files with top-level `likes_media_likes` (liked)
  - Files with top-level `saved_saved_media` (saved)
- Backend endpoint: `POST /api/import` (multipart `files[]`).
- Response:

```json
{
  "batchId": "cuid",
  "added": 10,
  "merged": 5,
  "errorsCount": 0
}
```

**Deduplication rules (by `igUrl`):**

- If `igUrl` already exists:
  - Update flags: `isLiked` / `isSaved` (OR them).
  - Update `timestamp`:
    - If existing is null and new has value → use new.
    - If both present → keep **newest** (`max`).
  - `username`:
    - If existing is null and new has value → use new.
    - Else keep existing.
- New `igUrl` → create a fresh row.

### 3.2. Feed page – `/`

- Toggle filter: **All / Liked / Saved**.
- Search `q` across:
  - `username`
  - `caption` (currently null / reserved for future)
  - `igUrl`
- Sort by `timestamp DESC` (nulls last via additional `createdAt DESC`).
- Pagination: 20 posts per page.
- Each card shows:
  - Badges: **Liked** / **Saved**
  - `username`
  - date (from `timestamp` if present)
  - `igUrl` with “Open in Instagram” link.

API backing this page:

- `GET /api/feed`
  - Query params:
    - `page` (1-based)
    - `pageSize`
    - `filter` = `all | liked | saved`
    - `q` (search string)

### 3.3. Stats page – `/stats`

Displays:

- Total unique posts.
- Count liked (`isLiked = true`).
- Count saved (`isSaved = true`).
- Last import time (from `ImportBatch.importedAt`).

Also available via `GET /api/stats`.

---

## 4. Data model (Prisma)

Defined in `prisma/schema.prisma`:

- **PostItem**
  - `id` (`String @id @default(cuid())`)
  - `platform` (`String @default("instagram")`)
  - `igUrl` (`String @unique`)
  - `igId` (`String?`) – reserved for future URL parsing.
  - `isLiked` (`Boolean @default(false)`)
  - `isSaved` (`Boolean @default(false)`)
  - `username` (`String?`)
  - `caption` (`String?`)
  - `timestamp` (`DateTime?`)
  - `importBatchId` (`String?` → relation to `ImportBatch`)
  - `createdAt` (`DateTime @default(now())`)
  - `updatedAt` (`DateTime @updatedAt`)

- **ImportBatch**
  - `id` (`String @id @default(cuid())`)
  - `source` (`String`)
  - `importedAt` (`DateTime @default(now())`)
  - `files` (`Json`) – metadata about imported files.
  - `status` (`String`) – e.g. `processing`, `completed`, `completed-with-errors`.
  - `stats` (`Json`) – counts like `{ added, merged }`.
  - `errorLog` (`Json`) – array of error messages.

---

## 5. Dev test script (Node)

There is a simple dev script in `scripts/dev-import.ts` that lets you import one JSON file from the command line (useful while iterating on parsing & dedupe logic).

Example usage:

```bash
npx prisma db push
npx ts-node --project tsconfig.json scripts/dev-import.ts data/sample-likes.json
```

Or via npm script:

```bash
npm run dev:import -- data/sample-likes.json
```

You can also pass the saved example:

```bash
npm run dev:import -- data/sample-saved.json
```

The script:

- Detects file type by top-level keys:
  - `likes_media_likes` → liked
  - `saved_saved_media` → saved
- Parses & normalizes data.
- Applies the **same deduplication rules** as the `/api/import` route.
- Creates an `ImportBatch` row with `source = "dev-script"`.

---

## 6. Manual test checklist

### 6.1. Import & dedupe

- **Import liked-only JSON**
  - Go to `/import`.
  - Upload a liked JSON file (like `data/sample-likes.json`).
  - Confirm response shows:
    - `added` & `merged` counts.
    - `errorsCount = 0`.
- **Import saved-only JSON** (with overlapping `igUrl` to liked)
  - Import a saved JSON that shares a URL with an existing liked post.
  - Check that:
    - Post appears once in the feed.
    - Both **Liked** and **Saved** badges are visible.
- **Re-import the same file**
  - Import the exact same file again.
  - Confirm:
    - `added` stays `0`, `merged` increments appropriately.

### 6.2. Feed filters & search

- On `/`:
  - Toggle **All / Liked / Saved**:
    - All: shows all imported posts.
    - Liked: only `isLiked = true`.
    - Saved: only `isSaved = true`.
  - Try searching:
    - By `username` (from the JSON `title`).
    - By part of the `igUrl`.
  - Confirm pagination:
    - If >20 posts, check next/previous buttons.

### 6.3. Stats

- On `/stats`:
  - Confirm:
    - Total unique posts matches what you see in the feed.
    - Liked / saved counts make sense.
    - Last import time updates after new imports.

---

## 7. Next possible improvements

- **Full‑text search (FTS)**:
  - Add SQLite FTS or use a search index for better search across captions, usernames, and notes.
- **Thumbnails & previews**:
  - Resolve Instagram oEmbed or cached screenshots for small thumbnails in the feed cards.
- **Notes / tags / collections**:
  - Add fields on `PostItem` like `notes`, `tags[]`, or many-to-many `Collections`.
  - Simple UI in the feed card to tag or annotate posts.
- **Follower data (optional)**:
  - Parse the followers JSON export into a separate `Follower` table.
  - Show overlap between who you follow vs posts you like/save.
- **Better error surfacing**:
  - Surface per-file error logs from `ImportBatch.errorLog` in the UI.
- **IG ID extraction**:
  - Parse `igId` from URL (`/reel/{id}/`, `/p/{id}/`, etc.) for richer integration later.

