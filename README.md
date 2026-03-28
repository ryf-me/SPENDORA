# Spendora

Spendora is a Vite + React expense tracker with Firebase auth/data, debtor tracking, reports, and an authenticated AI assistant backed by OpenRouter.

## Current Release

- App version: `v0.5.0`
- Release notes: [RELEASE.md](./RELEASE.md)

## Stack

- Frontend: React 19, TypeScript, Vite
- Styling: Tailwind CSS v4
- Backend services: Firebase Auth, Firestore, Firebase Storage
- AI: OpenRouter via `api/ai-assistant.js`
- Deployment: Vercel

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
- Security headers configured in `vercel.json`

## Local Development

### Prerequisites

- Node.js 18+
- npm
- A Firebase project
- An OpenRouter API key

### Install

```bash
npm install
```

### Environment variables

Create `.env.local` from `.env.example` and set:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
OPENROUTER_API_KEY=your_server_openrouter_api_key
APP_URL=https://your-production-url.vercel.app
```

Notes:

- `OPENROUTER_API_KEY` is server-side only. Do not prefix it with `VITE_`.
- `APP_URL` is optional locally and recommended for production.

### Start the app

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Build

```bash
npm run lint
npm run build
```

## Deployment

### Vercel

Set these environment variables in Vercel:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `OPENROUTER_API_KEY`
- `APP_URL`

### Firebase rules

This repo includes:

- `firestore.rules`
- `storage.rules`

Deploy them separately from the Vercel app:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

If you skip the Firebase rules deploy, your Vercel app may work while Firestore or Storage stays misconfigured.

## Security Notes

- The AI endpoint validates request size and sanitizes client-provided summary context.
- Avatar uploads are restricted by Firebase Storage rules and client-side file checks.
- Security headers are configured in `vercel.json`.
- The current AI rate limiter is in-memory, so it is best-effort on Vercel rather than globally shared.
- `npm audit` is clean at the time of `v0.5.0`.

## Project Structure

```text
spendora/
|-- api/
|   `-- ai-assistant.js
|-- src/
|   |-- components/
|   |-- context/
|   |-- pages/
|   `-- firebase.ts
|-- firestore.rules
|-- storage.rules
|-- vercel.json
`-- vite.config.ts
```

## Useful Commands

- `npm run dev` - start local development
- `npm run lint` - run TypeScript checks
- `npm run build` - create the production build
- `npm run preview` - preview the built app

## Support

- Repository: `https://github.com/ryf-me/SPENDORA`
- Contact: `insathraif004@gmail.com`
