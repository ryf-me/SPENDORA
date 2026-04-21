# Spendora

Spendora is a Vite + React expense tracker backed by Supabase Auth, Postgres, Storage, Realtime, and Edge Functions. The frontend is built as a static site for Cloudflare Pages, while the AI assistant runs through the Supabase `ai-assistant` Edge Function.

## Stack

- Frontend: React 19, TypeScript, Vite
- Styling: Tailwind CSS v4
- Backend: Supabase Auth, Postgres, Storage, Realtime, Edge Functions
- AI: OpenRouter via `supabase/functions/ai-assistant`
- Hosting: Cloudflare Pages

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example` and set:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Do not add provider API keys such as Gemini or OpenRouter to `.env.local` or any `VITE_*` variable. `VITE_*` values are exposed to the browser bundle.

Start the app:

```bash
npm run dev
```

## Supabase Setup

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

Set the Edge Function secret:

```bash
supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key
```

If you keep local server-side secrets for automation, store them outside browser-scoped env files and rotate them immediately if they were ever written to disk in plaintext.

Deploy the function:

```bash
supabase functions deploy ai-assistant
```

The frontend calls `https://<project-ref>.supabase.co/functions/v1/ai-assistant` with the user's access token.

## Cloudflare Pages Deployment

Use Cloudflare Pages with:

- Build command: `npm run build`
- Build output directory: `dist`

Set only these frontend environment variables in Pages:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not set AI provider keys or service-role keys as frontend environment variables.

After changing environment variables, trigger a clean Pages rebuild so the latest asset bundle is served.

## Security Notes

- The AI function validates Supabase auth before calling OpenRouter.
- Row Level Security restricts each user to their own data.
- Avatar uploads are limited by client-side checks and Supabase Storage policies.
- Static security headers are defined in `public/_headers`.
- Local development defaults to `127.0.0.1`; use `npm run dev:host` or `npm run preview:host` only when LAN access is intentionally required.

## Useful Commands

- `npm run dev` - start local development
- `npm run lint` - run TypeScript checks
- `npm run build` - create the production build
- `npm run preview` - preview the built app locally
- `npm run supabase:link` - link the repo to the hosted Supabase project
- `npm run supabase:db:push` - apply repo migrations to the linked project
- `npm run supabase:secrets:set` - push function secrets from `supabase/.env`
- `npm run supabase:functions:deploy` - deploy the `ai-assistant` function

## Support

- Repository: `https://github.com/ryf-me/SPENDORA`
- Contact: `insathraif004@gmail.com`
