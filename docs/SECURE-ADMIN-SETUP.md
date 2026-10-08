# ORBI LIVING · Secure administration foundation (OC-PC2-40)

## Current scope
Backend-ready, not activated. A Supabase project must be provisioned before the authenticated API is usable. The UI still shows the local finance prototype; there is no production admin CRUD interface yet. The finance API only supports listing and creating private draft records, not editing or publishing official charges.

## Configuration
1. Create a dedicated Supabase project and apply `supabase/migrations/20261008_secure_finance.sql` using an authorized SQL console.
2. Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` as **server-side** Vercel environment variables. Do not use `NEXT_PUBLIC_` for these values. Never commit secrets or use a service_role key in the frontend.
3. Create an Auth user in Supabase, then add an administrator membership for community `pc2` through a trusted administrative console. Public sign-up and self-assignment of roles are intentionally unavailable.
4. Test login POST `/api/auth/login`, session GET `/api/auth/session`, finance GET/POST `/api/admin/finance`, and logout POST `/api/auth/logout`.
5. Before production launch: implement refresh-token rotation or short-session re-login, rate limiting on login, CSRF/origin validation for cookie-authenticated writes, server-side audit coverage for UPDATE/DELETE, migrations/backup, monitoring and a private admin UI.
6. Confirm tenant isolation and resident unit ownership before adding private billing documents.

## Security limitations
- No data is stored without backend configuration.
- The API verifies the user against Supabase Auth and membership in `community_members`.
- Finance drafts use database row-level security, restricted to administrators; residents and committee members cannot list or create them.
- No individual salaries, resident data, banking details, or documents are imported.
- The login endpoint should **not** be exposed as a supported production feature until rate limiting and CSRF protections are implemented.
