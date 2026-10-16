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
| incident report/create | new INSERT without a durable idempotency key | **open**: a lost response after INSERT can leave an ambiguous result |

This table describes the currently exposed Administrator workspace path. Other creation-style endpoints must be reviewed before being activated in that workspace.

## Immediate guard

For same-origin `POST /api/operations/*` calls, a network failure or `5xx` is treated conservatively as an ambiguous result. The UI tells the Administrator not to repeat the action and keeps the warning visible until a successful fresh read of `/api/operations/dashboard` verifies current state.

The guard does not read response bodies, does not persist payloads, does not add telemetry and does not claim that a failed response means the database write succeeded.

## Durable idempotency remains future work

The UI warning is **not** a substitute for durable idempotency. Before real-data Production activation, create-style mutations that can be retried must be reviewed for a server-validated opaque idempotency key, payload-equivalence checks and a database-enforced uniqueness/replay strategy. That design requires a separately reviewed schema/API change and is not implemented by this document.

No Production configuration, Supabase migration, P1E restore work, new roles or real condominium data are introduced here.
