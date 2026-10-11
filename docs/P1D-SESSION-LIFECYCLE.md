# ORBI LIVING — P1D Session Lifecycle

## Goal
Close the largest gap left in the P1A authentication prototype: a login that stored only the short-lived access JWT and therefore could not safely renew the browser session.

P1D keeps the explicit server-only Auth boundary (no Supabase token is exposed to client JavaScript) and adds refresh rotation plus best-effort server-side sign-out.

## Cookie model
Two cookies are server-only:

- `orbi_session`: Supabase access JWT; `HttpOnly`, `Secure` in production, `SameSite=Strict`, root path. Its browser lifetime follows the Auth `expires_in` value, bounded defensively to 24 hours.
- `orbi_refresh`: refresh token; `HttpOnly`, `Secure` in production, `SameSite=Strict`, root path. In this staging cut it is intentionally a **browser-session cookie** (no persistent Max-Age). A later remember-me/product policy can change persistence explicitly.

Neither cookie is readable by client JavaScript.

## Login
`POST /api/auth/login`

- same-origin required;
- rejects oversized/invalid requests;
- calls Supabase Auth password grant;
- requires both access and refresh tokens in the response;
- stores them only in HttpOnly cookies;
- returns `Cache-Control: private, no-store`;
- upstream Auth request has a 10-second timeout.

No credentials, token values or upstream error bodies are logged or returned.

## Refresh
`POST /api/auth/refresh`

- same-origin required;
- reads only the HttpOnly refresh cookie;
- calls Supabase Auth `/token?grant_type=refresh_token`;
- replaces the access token and stores the rotated refresh token when Supabase returns one;
- if Auth declares the refresh token invalid, both cookies are cleared and the route returns `401`;
- a transient upstream/network timeout returns `503` without destroying the existing refresh cookie;
- response is `private, no-store`.

Supabase refresh tokens may rotate, so P1D always persists the newest value returned by Auth.

## Logout
`POST /api/auth/logout`

- same-origin required;
- attempts Supabase `logout?scope=local`, so only the current browser/device session is targeted;
- if the access JWT has already expired but a refresh cookie remains, P1D makes one refresh attempt and then revokes the resulting current session;
- both local cookies are cleared regardless of upstream availability;
- response reports whether server-side session revocation succeeded, without returning tokens or upstream details.

Supabase access JWTs cannot be revoked before their encoded expiry. Clearing the local cookie removes browser access; server-side local sign-out revokes the refresh-backed session.

## Bounded upstream calls
Auth user verification, membership resolution, Auth token calls and PostgREST operations have a 10-second request timeout in this cut. This prevents a stalled upstream Auth request from leaving a route handler waiting indefinitely.

## Vercel staging boundary
The branch `oc-pc2-45-session-lifecycle` has its own Preview-scoped `SUPABASE_URL`, publishable key and `ORBI_COMMUNITY_ID=pc2`. Production variables are not changed and no key is committed to GitHub. A fresh preview deployment is required after environment-variable changes before `configured:true` can be treated as verified for this branch.

## Deliberate non-goals
P1D does **not** yet implement:
- real staff/resident users;
- remember-me persistence across browser restarts;
- app-level durable login rate limiting;
- MFA;
- CAPTCHA;
- leaked-password protection (Supabase documents this as Pro+; staging is Free);
- automatic client-side refresh scheduling;
- automatic refresh inside every protected operation;
- account recovery/password reset UI.

## Rate-limit note
Supabase rate-limits the Auth token endpoint itself. However, because ORBI currently proxies login/refresh through Vercel using a publishable key, production still needs its own durable abuse-control strategy; do not rely solely on an in-memory counter in a serverless process.

## Acceptance gate
Before this cut can be considered production-ready:
1. `npm run check` must be GREEN;
2. preview deployment must be READY with branch-scoped staging variables;
3. no-cookie `/api/auth/refresh` must fail closed without exposing data;
4. no-cookie `/api/auth/logout` must safely clear local state;
5. a supported synthetic Supabase Auth password account must prove login → session → refresh rotation → logout end-to-end;
6. stale/invalid refresh behavior must be verified end-to-end;
7. app-level rate limiting and the production MFA/password policy must be decided;
8. no real PII may be introduced before those gates pass.

## Source basis
Implementation follows current Supabase Auth behavior documented for refresh-token rotation and sign-out scopes, plus the Supabase Auth OpenAPI contract for `/token?grant_type=refresh_token` and `/logout?scope=local`.
