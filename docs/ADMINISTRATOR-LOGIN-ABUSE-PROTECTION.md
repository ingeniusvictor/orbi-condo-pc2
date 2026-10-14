# ORBI LIVING — Administrator login abuse protection

## Scope
This document defines the login-abuse boundary for the current **Administrator-only · synthetic staging** cut.

It does not enable Production, add real users, create new operational roles, or introduce a Supabase secret/service-role key into the application runtime.

## Current protection layers
The private Administrator login already has these application boundaries before an upstream password grant is accepted:

- same-origin POST requirement;
- fail-closed backend configuration check;
- bounded request body/content length;
- bounded email/password input lengths;
- server-side Supabase Auth exchange;
- HttpOnly + Secure + SameSite=Strict session cookies only after a successful grant;
- no Supabase access/refresh token returned to browser JavaScript;
- normalized login errors that do not expose Supabase response bodies.

Supabase Auth itself enforces platform-level authentication rate limits and returns HTTP `429 Too Many Requests` when an applicable bucket is exhausted.

## OC-PC2-81 contract
The ORBI login boundary must preserve an upstream rate-limit signal instead of misclassifying it as bad credentials:

- upstream `429` → application `429`;
- application response body remains generic: `Demasiados intentos. Intenta nuevamente más tarde.`;
- a numeric `Retry-After` may cross the boundary only when it is an integer between 1 and 86,400 seconds;
- HTTP-date, malformed, zero, negative or oversized retry values are discarded;
- arbitrary upstream headers never cross the boundary;
- upstream error bodies/details never cross the boundary;
- no cookies are emitted for rate-limited or failed login requests;
- upstream `5xx` is normalized to application `503`, not falsely reported as invalid credentials;
- ordinary rejected credentials remain normalized `401`.

`scripts/test-auth-login-upstream-semantics.mjs` is the executable hermetic contract for those rules.

## Durable enforcement strategy
A process-local/in-memory counter is explicitly **not acceptable** as the durable control because Vercel functions can be replicated, recycled and executed in multiple regions.

The selected durable edge strategy for a future Production-enabled cut is a Vercel Firewall rate-limit rule scoped as narrowly as the platform permits:

```text
Method: POST
Path:   /api/auth/login
Key:    client IP
Action: HTTP 429 when the threshold is exceeded
```

Initial threshold and final activation must be reviewed against the actual Production access model. The current recommended starting point for a single private Administrator surface is **10 attempts per 60 seconds per IP**, followed by observation/tuning rather than silently raising the threshold.

Vercel Hobby currently provides a limited custom Firewall/rate-limit allowance, so this design does not require adding an in-process rate-limit dependency or a privileged Supabase key to the application.

## Why the Vercel rule is not activated now
Vercel Firewall configuration belongs to the project security boundary, while this project still has historical Production host/deployments that are deliberately frozen. Publishing a project-level rule now could change traffic handling outside the synthetic Preview under test.

Therefore the current staging-only cut deliberately does **not** publish or mutate the Vercel Firewall. That is a safety boundary, not a claim that durable edge enforcement is already active.

Production remains blocked until the firewall activation can be reviewed as an intentional Production-security change.

## Defense in depth for a future Production cut
When Production is deliberately opened, the intended order is:

1. Vercel Firewall rate limit on `POST /api/auth/login` as the durable first edge bucket;
2. existing application validation/origin/body-size controls;
3. Supabase Auth platform protections and rate limits;
4. ORBI preservation of `429`/safe `Retry-After` semantics;
5. optional CAPTCHA/Turnstile if observed abuse warrants a human/bot challenge layer;
6. MFA/password/leaked-password policy as a separate authentication-hardening decision.

Do not use a `service_role` or `sb_secret_*` key in the browser. Do not add a privileged Supabase key to the Vercel application merely to implement IP forwarding/rate limiting without a separate security review.

## Current gate state
After OC-PC2-81:

- application handling of upstream throttling: **contract-protected**;
- durable edge strategy: **defined**;
- Vercel Firewall rate-limit activation: **deferred / not active**;
- CAPTCHA: **not active**;
- MFA/password/leaked-password Production policy: **not yet approved**;
- Production: **blocked**.

Current state remains:

**ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY · PRODUCTION BLOCKED · P1E RESTORE NOT PROVEN**.
