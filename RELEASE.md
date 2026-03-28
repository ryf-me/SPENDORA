# Spendora Release Notes

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
