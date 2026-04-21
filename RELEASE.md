# Spendora Release Notes

## v0.6.0

Release focus: Cloudflare Workers migration, unified API hosting, and deployment/docs alignment.

### Included changes

- Moved the authenticated AI assistant endpoint from `api/ai-assistant.js` into `worker/index.ts`.
- Replaced the custom Vercel local API middleware with the Cloudflare Vite plugin for local dev and preview flows.
- Added `wrangler.jsonc` so the SPA assets and `/api/ai-assistant` run as one Cloudflare Workers project.
- Added `public/_headers` and Worker-level response headers to preserve the app's security policy after the platform move.
- Split local server-side secrets into `.dev.vars` / `.dev.vars.example` and updated `.gitignore` to keep Worker secrets out of git.
- Added a `deploy` script and rewrote the README deployment guide for the Cloudflare Workers setup.
- Removed the Vercel-specific config and analytics dependency from the app shell and package graph.

### Release checklist

- Set `OPENROUTER_API_KEY`, `FIREBASE_API_KEY`, and `APP_URL` as Wrangler secrets before deployment.
- Verify `/api/ai-assistant` works in `npm run dev` and `npm run preview`.
- Confirm SPA route refreshes resolve correctly through the Workers asset config.
- Deploy Firebase rules separately after the application deploy if they changed.

### Notes

- This release changes the deployment target from Vercel to Cloudflare Workers.
- The GitHub release for this version should be published from tag `v0.6.0`.
- The canonical GitHub repository location is `https://github.com/ryf-me/SPENDORA_expense_tracker`.

## v0.5.0

Release focus: product expansion across reporting, AI workflows, debtor follow-up, and usability upgrades.

### Included changes

- Rebuilt the dashboard around a richer system-health layout and added a selectable reporting window with date-range inputs.
- Added calendar date selection with a details popup so users can inspect all records for a chosen day.
- Redesigned the AI assistant into a more modern workspace and added:
  - English and Tamil response toggles
  - clickable live snapshot cards
  - clickable assistant-scope prompt actions
- Added AI-generated debtor reminder drafts with optional user instructions for tone and wording.
- Updated debtor status labels to show overdue timing details instead of only generic status text.
- Expanded settings/profile avatar selection with curated DiceBear human-style avatar libraries.
- Added recurring-expense and notification-center plumbing in the application shell.
- Updated dependency state and cleared the npm audit report back to `0` vulnerabilities.

### Release checklist

- Verify dashboard metrics against multiple reporting windows.
- Confirm AI assistant responses in both English and Tamil.
- Test debtor reminder drafting and sending from a debtor detail page.
- Test recurring-expense and notification flows after deployment.

### Notes

- Local `.env` and `.env.local` secrets remain untracked and were not included in this release.
- The canonical GitHub repository location is `https://github.com/ryf-me/SPENDORA`.

## v0.4.3

Release focus: deployment readiness, security hardening, and documentation cleanup.

### Included changes

- Hardened the `/api/ai-assistant` server function with:
  - request size limits
  - input and context sanitization
  - per-instance rate limiting
  - upstream timeout handling
  - stricter error responses
- Moved avatar uploads onto a rules-friendly Firebase Storage path and added file type/size checks.
- Added `storage.rules` and wired Firebase Storage rules into `firebase.json`.
- Removed the unused `@google/genai` dependency and refreshed the lockfile.
- Cleared the npm audit report to `0` known vulnerabilities at the time of release.
- Updated environment variable documentation for `OPENROUTER_API_KEY`.
- Rewrote `README.md` to match the current Vite, Vercel, Firebase, and OpenRouter setup.

### Release checklist

- Set Vercel environment variables before deployment.
- Deploy Firebase rules separately:
  - `firebase deploy --only firestore:rules`
  - `firebase deploy --only storage`
- Verify the AI endpoint with an authenticated user after deployment.

### Notes

- The AI rate limiter is in-memory. On Vercel this is best-effort per instance, not a shared global quota control.
- The local `.vercel/` folder remains intentionally gitignored.
