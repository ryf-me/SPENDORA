# Supabase Assets

This folder contains the repo-managed Supabase backend assets for Spendora:

- `migrations/` - SQL schema, RLS, storage, and RPC setup
- `functions/ai-assistant/` - authenticated AI Edge Function

Typical rollout order:

1. Apply the SQL migration to staging.
2. Set `OPENROUTER_API_KEY` as a Supabase secret.
3. Deploy `functions/ai-assistant`.
4. Run the migration scripts from `scripts/supabase/`.
5. Verify counts and financial totals with `npm run migrate:verify`.
6. Repeat in production during a short write freeze.

Required environment variables for deployment and migration:

- `SUPABASE_ACCESS_TOKEN` for Supabase CLI authentication
- `SUPABASE_DB_URL` for applying SQL migrations and importing auth users
- `SUPABASE_SERVICE_ROLE_KEY` for admin upserts and storage import
- `SUPABASE_URL` or `VITE_SUPABASE_URL` for API access
- `OPENROUTER_API_KEY` for the `ai-assistant` Edge Function secret

Helpful commands once the credentials are available:

- `npm run supabase:link`
- `npm run supabase:db:push`
- `npm run supabase:secrets:set`
- `npm run supabase:functions:deploy`
- `npm run migrate:auth`
- `npm run migrate:data`
- `npm run migrate:storage`
- `npm run migrate:verify`

Expected Firebase export layout before running the import scripts:

- `exports/firebase-auth-users.json`
- `exports/firestore/users.json`
- `exports/firestore/categories.json`
- `exports/firestore/expenses.json`
- `exports/firestore/debtors.json`
- `exports/firestore/payments.json`
- `exports/firestore/feedback.json`
- `exports/storage/...`
