# Spendora Release Notes

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
