# Spendora Release Notes

## v0.7.1

Release focus: Supabase backend adoption, Pages-first hosting, and runtime cleanup.

### Included changes

- Standardized the runtime on Supabase for auth, data, storage, realtime, and the AI assistant backend.
- Kept the frontend auth/data abstractions stable while moving their implementation to Supabase APIs and Realtime.
- Added repo-managed Supabase migrations, storage policies, helper RPCs, and Edge Function deployment config.
- Removed the alternate Worker deployment path so the frontend build now targets Cloudflare Pages only.
- Removed migration-era compatibility code and docs so the repo is cleanly Supabase-only.
- Updated deployment documentation and env examples for the Pages + Supabase setup.

### Release checklist

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend deployment.
- Apply the SQL migration in `supabase/migrations/20260421_initial_supabase_cutover.sql` to the hosted Supabase project.
- Set `OPENROUTER_API_KEY` as a Supabase Edge Function secret and deploy `supabase/functions/ai-assistant`.
- Configure Supabase Auth site URL, redirect URLs, and the Google provider before enabling Google sign-in in production.
- Ensure Cloudflare Pages serves the current `main` branch build with only the Supabase frontend environment variables.

### Notes

- This release makes Cloudflare Pages the canonical frontend host.
- Backend responsibilities live in Supabase.
- The GitHub release for this version should be published from tag `v0.7.1`.
- The canonical GitHub repository location is `https://github.com/ryf-me/SPENDORA`.
