# Spendora Release Notes

## v0.7.2

Release focus: profile photo uploads with an in-app editor, while keeping the existing preset avatar library.

### Included changes

- Added a first-class personal photo upload flow in Settings alongside the preset avatar picker.
- Added a custom canvas-based image editor with drag, zoom, circular preview, reset, and cancel actions.
- Reused the existing Supabase avatar upload path by exporting the edited crop as an image file before save.
- Kept preset avatar selection intact and allowed users to switch back before saving profile changes.
- Ensured profile photo changes flow through the existing auth/profile refresh path so updated avatars propagate across the app.

### Release checklist

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend deployment.
- Confirm the Supabase `avatars` bucket and storage policies are applied in the hosted project.
- Ensure `OPENROUTER_API_KEY` remains configured for the `ai-assistant` Supabase Edge Function.
- Verify Cloudflare Pages is building from the current `main` branch and serving the newest asset hash.
- Publish the GitHub release for this version from tag `v0.7.2` and mark it as the latest release.

### Notes

- Users can now upload and crop a personal profile picture directly from the Settings profile tab.
- The preset avatar library remains available as an alternative to personal photo uploads.
- The canonical GitHub repository location is `https://github.com/ryf-me/SPENDORA`.

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
