# Spendora

Spendora is a Vite + React expense tracker with Firebase auth/data, debtor tracking, reports, and an authenticated AI assistant backed by OpenRouter. The app now deploys as a single Cloudflare Workers project that serves the SPA and the `/api/ai-assistant` endpoint together.

## Current Release

- App version: `v0.6.0`
- Release notes: [RELEASE.md](./RELEASE.md)

## Stack

- Frontend: React 19, TypeScript, Vite
- Styling: Tailwind CSS v4
- Backend services: Firebase Auth, Firestore, Firebase Storage
- AI: OpenRouter via `worker/index.ts`
- Deployment: Cloudflare Workers with static assets

## Features

- Expense tracking with categories, history, and reporting
- Debtor tracking with partial and full payment flows
- Reporting dashboard with selectable date-range windows
- Calendar date drill-down with a details modal
- Authenticated AI assistant with live snapshot actions, assistant-scope prompts, and Tamil replies
- AI-generated debtor reminder drafts with optional user guidance
- Profile settings with curated DiceBear avatar libraries
- Recurring expenses and in-app notification support
- Firebase-backed real-time data sync
- Security headers configured for both static assets and Worker API responses

## Local Development

### Prerequisites

- Node.js 18+
- npm
- A Firebase project
- An OpenRouter API key
- A Cloudflare account for deployment

### Install

```bash
npm install
```

### Frontend environment variables

Create `.env.local` from `.env.example` and set:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Worker secrets for local development

Create `.dev.vars` from `.dev.vars.example` and set:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
FIREBASE_API_KEY=your_firebase_web_api_key
APP_URL=http://localhost:3000
```

Notes:

- `FIREBASE_API_KEY` is the server-side secret used by the Worker when it verifies Firebase ID tokens. For most Firebase web apps, this matches the Firebase Web API key you also expose as `VITE_FIREBASE_API_KEY`.
- `APP_URL` is required by the Wrangler config and is used as the app's canonical URL when calling OpenRouter.
- Do not commit `.dev.vars` or `.env.local`.

### Start the app

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Build and Preview

```bash
npm run lint
npm run build
npm run preview
```

`vite preview` runs with the Cloudflare Vite plugin, so the Worker API is available while previewing the production build locally.

## Deployment

### Cloudflare Workers

Set the frontend `VITE_FIREBASE_*` variables in your build environment, then configure the Worker secrets:

```bash
wrangler secret put OPENROUTER_API_KEY
wrangler secret put FIREBASE_API_KEY
wrangler secret put APP_URL
```

Deploy with:

```bash
npm run deploy
```

The project is configured in `wrangler.jsonc` with:

- `assets.not_found_handling = "single-page-application"` for SPA route refreshes
- `assets.run_worker_first = ["/api/*"]` so `/api/ai-assistant` reaches the Worker before asset handling
- required secret validation for `OPENROUTER_API_KEY`, `FIREBASE_API_KEY`, and `APP_URL`

### Firebase rules

This repo includes:

- `firestore.rules`
- `storage.rules`

Deploy them separately from the Cloudflare app:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

If you skip the Firebase rules deploy, your app may work while Firestore or Storage stays misconfigured.

## Security Notes

- The AI endpoint validates request size and sanitizes client-provided summary context.
- Avatar uploads are restricted by Firebase Storage rules and client-side file checks.
- Security headers for static assets are defined in `public/_headers`.
- Security headers for Worker-generated API responses are applied directly in `worker/index.ts`.
- The current AI rate limiter is in-memory, so it remains best-effort rather than globally shared.

## Project Structure

```text
spendora/
|-- public/
|   `-- _headers
|-- src/
|   |-- components/
|   |-- context/
|   |-- pages/
|   `-- firebase.ts
|-- worker/
|   `-- index.ts
|-- firestore.rules
|-- storage.rules
|-- vite.config.ts
`-- wrangler.jsonc
```

## Useful Commands

- `npm run dev` - start local development with Vite + Cloudflare Workers runtime
- `npm run lint` - run TypeScript checks
- `npm run build` - create the production build
- `npm run preview` - preview the built app with the Worker runtime
- `npm run deploy` - build and deploy to Cloudflare Workers

## Support

- Repository: `https://github.com/ryf-me/SPENDORA_expense_tracker`
- Contact: `insathraif004@gmail.com`
