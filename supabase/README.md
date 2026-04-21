# Supabase Assets

This folder contains the repo-managed Supabase backend assets for Spendora:

- `migrations/` - SQL schema, RLS, storage, and RPC setup
- `functions/ai-assistant/` - authenticated AI Edge Function

Typical rollout order:

1. Apply the SQL migration to staging.
2. Set `OPENROUTER_API_KEY` as a Supabase secret.
3. Deploy `functions/ai-assistant`.
4. Verify the `avatars` bucket, policies, and RLS-backed tables in the hosted project.
5. Repeat in production.

Required environment variables for deployment:

- `SUPABASE_ACCESS_TOKEN` for Supabase CLI authentication
- `SUPABASE_URL` or `VITE_SUPABASE_URL` for API access
- `OPENROUTER_API_KEY` for the `ai-assistant` Edge Function secret

Helpful commands once the credentials are available:

- `npm run supabase:link`
- `npm run supabase:db:push`
- `npm run supabase:secrets:set`
- `npm run supabase:functions:deploy`
