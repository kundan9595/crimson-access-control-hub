# Scott dashboard masters — Edge Function

The app calls the Supabase Edge Function `scott-dashboard-masters` only (never the Scott HTTP API from the browser). Configure these **Supabase project secrets** for the function runtime:

| Secret | Description |
|--------|-------------|
| `SCOTT_API_BASE_URL` | Base URL (no trailing slash), e.g. `https://leaderboard.sagarfab.com` — must expose `/api/v1/auth/authenticate`. Masters are proxied to **`/api/v1/...`** where the live API serves them (see function `resolveScottUpstream`); **`/api/dashboard/v1/...`** is only used for resources not available under `/api/v1/` on that host. |
| `SCOTT_AUTH_EMAIL` | Service account email used to obtain `auth_token` server-side. |
| `SCOTT_AUTH_PASSWORD` | Password for that account. |

Standard Edge env vars are provided automatically: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Auth verification (Scott API)

`POST {SCOTT_API_BASE_URL}/api/v1/auth/authenticate` with `Content-Type: application/x-www-form-urlencoded` and body `email` + `password` returns JSON. On success, `data.user.auth_token` is the bearer-style token used for subsequent API calls (the Edge Function sends it as the `Authorization` header).

**Email spelling:** The account that authenticates against `https://leaderboard.sagarfab.com` is **`admin@scottinternational.com`** (spelled with **international** — two `a`s). The address **`admin@scottinternation.com`** (missing an `a`) returns **Invalid credentials**; if a developer shares that variant, correct the spelling before setting `SCOTT_AUTH_EMAIL`.

Do **not** commit passwords; set `SCOTT_AUTH_EMAIL` and `SCOTT_AUTH_PASSWORD` only in Supabase Edge secrets (or local env for `supabase functions serve`).

## Local development

```bash
# From repo root; set secrets in supabase/.env or pass --env-file
supabase functions serve scott-dashboard-masters --no-verify-jwt
```

Deploy:

```bash
supabase functions deploy scott-dashboard-masters
```

Then set the three Scott secrets in the Supabase Dashboard → Edge Functions → Secrets.

## Optional rollback

To fall back to Supabase-only masters would require reintroducing the previous service implementations behind a feature flag; the current codebase routes these masters through the Edge Function only.
