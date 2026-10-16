# Administrator mutation ambiguity safety

Status: **INTERNAL ORBI · SYNTHETIC STAGING ONLY · NOT A PRODUCTION POLICY**

## Why this exists

A browser can lose the response after the server has already applied a change. In that case, treating a transport failure as proof that the write failed can cause a duplicate when the user presses the action again.

The Administrator workspace therefore distinguishes between a confirmed application error and an **unconfirmed result**. An unconfirmed result must be verified with a fresh dashboard read before the action is repeated.

## Current mutation map

| Route family | Current protection | Blind retry risk |
| --- | --- | --- |
| shift command | `expectedRevision` plus conditional PATCH and `409` | bounded: the same stale revision cannot apply twice |
| shift gap report | `expectedRevision` plus conditional PATCH and `409` | bounded: the same stale revision cannot apply twice |
| shift handoff | `expectedRevision` plus conditional PATCH and `409` | bounded: the same stale revision cannot apply twice |
| incident command | `expectedRevision` plus conditional PATCH and `409` | bounded: the same stale revision cannot apply twice |
| incident report/create | opaque UUID request key plus database uniqueness by community + creator + key | bounded after the staging migration: one logical request can create at most one incident |

This table describes the currently exposed Administrator workspace path. Other creation-style endpoints must be reviewed before being activated in that workspace.

## Immediate ambiguity guard

For same-origin `POST /api/operations/*` calls, a network failure or `5xx` is treated conservatively as an ambiguous result. The UI tells the Administrator not to repeat the action and keeps the warning visible until a successful fresh read of `/api/operations/dashboard` verifies current state.

The guard does not read response bodies, does not persist payloads, does not add telemetry and does not claim that a failed response means the database write succeeded.

## Durable incident-create idempotency

Incident creation uses a route-local, client-generated UUID carried in the private `x-orbi-idempotency-key` request header. The browser bridge overwrites the header itself, keeps the pending key only in memory and never writes it to local storage, session storage or cookies. The key is an opaque technical identifier; it is not resident or staff data.

The database stores the key in nullable `incidents.client_request_id` and enforces uniqueness on `(community_id, created_by, client_request_id)` whenever the key is present. Historical synthetic rows can remain `NULL`, so the migration is additive and backward-compatible.

The first accepted request returns the newly created incident. If the same logical request is repeated with the same key, the unique constraint prevents a second row; the API resolves the existing incident for the same community and creator and returns it as a replay. The idempotency key is not part of the dashboard projection or API incident response.

The browser may make at most one automatic retry for incident creation after a network failure or `5xx`, and that retry uses the same key. There is no retry loop. If the retry is still unresolved, the existing **Resultado no confirmado** guard remains active and requires a fresh dashboard verification before manual repetition.

A replay never updates the existing incident. Reusing an already-consumed key therefore cannot mutate the row that won the first insert. This mechanism provides at-most-once incident creation for a given community, authenticated creator and opaque request key.

## Boundaries

This change does not make other create-style routes idempotent automatically. Each such route must receive its own reviewed server/database contract before activation in the Administrator workspace.

No Production configuration, Production Supabase project, P1E restore work, new roles or real condominium data are introduced here. The migration is intended only for synthetic staging validation before any future Production decision.
