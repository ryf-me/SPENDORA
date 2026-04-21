# Spendora

Spendora is a Vite + React expense tracker with Supabase auth/data/storage, debtor tracking, reports, and an authenticated AI assistant backed by OpenRouter. The app is hosted as a Cloudflare Workers static deployment, while backend ownership now lives in Supabase Auth, Postgres, Storage, Realtime, and Edge Functions.

## Stack

- Frontend: React 19, TypeScript, Vite
- Styling: Tailwind CSS v4
- Backend services: Supabase Auth, Postgres, Storage, Realtime, Edge Functions
- AI: OpenRouter via `supabase/functions/ai-assistant`
- Hosting: Cloudflare Workers static assets

## Features

- Expense tracking with categories, history, and reporting
- Debtor tracking with partial and full payment flows
- Reporting dashboard with selectable date-range windows
- Calendar date drill-down with a details modal
- Authenticated AI assistant with live snapshot actions, assistant-scope prompts, and Tamil replies
- AI-generated debtor reminder drafts with optional user guidance
- Profile settings with curated DiceBear avatar libraries
- Recurring expenses and in-app notification support
- Supabase-backed real-time data sync

## Local Development

### Prerequisites

- Node.js 20+
- npm
- A Supabase project
- An OpenRouter API key
- A Cloudflare account for the static host

### Install

```bash
npm install
```

### Frontend environment variables

Create `.env.local` from `.env.example` and set:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Start the app

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Supabase Setup

### Database and storage

Apply the SQL migration in `supabase/migrations/20260421_initial_supabase_cutover.sql` to create:

- `profiles`
- `categories`
- `expenses`
- `debtors`
- `payments`
- `feedback`
- RLS policies
- the `avatars` storage bucket
- helper RPCs used by the frontend

### AI Edge Function

Set the function secret in Supabase:

```bash
supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key
```

Deploy the function:

```bash
supabase functions deploy ai-assistant
```

The frontend calls `https://<project-ref>.supabase.co/functions/v1/ai-assistant` with the user access token.

## Cloudflare Deployment

The Cloudflare Worker now serves static assets and security headers only.

Build and deploy with:

```bash
npm run deploy
```

Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are available in the build environment before running the deploy.

## Migration Utilities

Repo-local migration scripts live under `scripts/supabase/`:

- `npm run migrate:auth`
- `npm run migrate:data`
- `npm run migrate:storage`
- `npm run migrate:verify`

Expected environment variables for the migration utilities:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=postgres://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
FIREBASE_AUTH_EXPORT_PATH=exports/firebase-auth-users.json
FIREBASE_EXPORT_DIR=exports/firestore
FIREBASE_STORAGE_EXPORT_DIR=exports/storage
AUTH_MAPPING_OUTPUT_PATH=storage/supabase-auth-map.json
```

Notes:

- The auth import script builds a Firebase UID to Supabase user mapping and flags imported users for password reset unless you plug in a custom password import flow.
- Run the migration scripts against staging first, then repeat during a short production write freeze before cutover.

## Security Notes

- The AI function validates Supabase auth before calling OpenRouter.
- Row Level Security restricts each user to their own data.
- Avatar uploads are limited by client-side checks and Supabase Storage policies.
- Security headers for static assets are defined in `public/_headers` and mirrored in `worker/index.ts`.

## Project Structure

```text
spendora/
|-- public/
|   `-- _headers
|-- scripts/
|   `-- supabase/
|-- src/
|   |-- components/
|   |-- context/
|   |-- pages/
|   `-- supabase.ts
|-- supabase/
|   |-- functions/
|   `-- migrations/
|-- worker/
|   `-- index.ts
|-- vite.config.ts
`-- wrangler.jsonc
```

## Useful Commands

- `npm run dev` - start local development with Vite + Cloudflare Workers runtime
- `npm run lint` - run TypeScript checks
- `npm run build` - create the production build
- `npm run preview` - preview the built app with the Worker runtime
- `npm run deploy` - build and deploy the static Cloudflare Worker
- `npm run migrate:auth` - import exported Firebase auth users into Supabase
- `npm run migrate:data` - import exported Firestore collections into Supabase
- `npm run migrate:storage` - upload exported avatar files into Supabase Storage
- `npm run migrate:verify` - compare exported Firebase data against Supabase totals and counts

## Support

- Repository: `https://github.com/ryf-me/SPENDORA`
- Contact: `insathraif004@gmail.com`
