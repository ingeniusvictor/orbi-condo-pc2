# ORBI LIVING — P1E Backup and Recovery Runbook

## Purpose
Define a recovery path **before** any real resident, worker or operational data enters ORBI LIVING. A backup is not considered valid merely because a file exists; recovery must eventually be restored into an independent environment and verified.

## Current staging constraints
The current Supabase project is on the Free plan. Current Supabase documentation states that Free projects do not provide downloadable automatic platform backups. For Free projects, Supabase recommends regular logical exports with `supabase db dump` and off-site retention.

Do not treat project pause/restore as an independent backup. It does not satisfy the ORBI recovery gate.

## Sources of truth
Recovery uses several independent sources:

1. **GitHub migrations** — canonical schema evolution, RLS policies, functions and triggers.
2. **Logical database backup** — roles, schema and data exported from the source database.
3. **Vercel configuration inventory** — environment variable names and deployment configuration; secret values must stay in Vercel/Supabase secret stores and must never enter Git.
4. **Operational configuration checklist** — Auth providers, SMTP, Storage, Edge Functions, custom domains and other non-database settings must be recreated separately if they are introduced later.

Git history alone is not a data backup.

## Logical backup set
Supabase's current migration guidance exports three files using its CLI rather than raw `pg_dump`, because the CLI performs Supabase-specific filtering:

```powershell
supabase db dump --db-url "$env:SUPABASE_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$env:SUPABASE_DB_URL" -f schema.sql
supabase db dump --db-url "$env:SUPABASE_DB_URL" -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

The repository includes `scripts/backup-supabase-logical.ps1` to run the equivalent export into a timestamped local directory and generate SHA-256 hashes. The script never accepts a database password as a command-line argument and never prints the connection string.

## Credential handling
- Obtain the Session Pooler connection string from Supabase **Connect** when a real backup is performed.
- Put the connection string only in the process environment as `SUPABASE_DB_URL`.
- Never place it in Git, `.env` committed to Git, screenshots, issues or PR comments.
- Clear the variable after the backup session where practical.
- Backup files containing real data must never be committed to this public repository.

## Retention policy proposal
Until production requirements are formally approved:
- before any schema migration affecting real data: one fresh logical backup;
- daily while real operational data changes materially;
- retain at least 7 daily + 4 weekly recovery points;
- keep at least one encrypted copy outside the machine used to run the application;
- record backup timestamp, source project ref, tool version, hashes and operator in a private recovery register.

This is a proposed operational policy, not evidence that backups are already running.

## Restore drill
A recovery drill must restore into an **independent target**, never over the source project.

Supabase's current CLI restore guidance uses a fresh target project plus `psql` and the exported files. Before restoring schema, review target default privileges; Supabase's CLI docs specifically warn that target default privileges can otherwise grant broader access than the source dump intended.

High-level sequence:
1. create a fresh disposable target;
2. configure required extensions/settings;
3. restore roles, schema and data with `ON_ERROR_STOP=1`;
4. reapply/verify migration history where required;
5. verify RLS is enabled on every protected table;
6. run the ORBI role/tenant isolation matrix;
7. compare row counts and critical invariants;
8. test Auth re-login assumptions and invalidate old sessions as appropriate;
9. destroy or pause the disposable target after evidence is retained privately.

A restore that completes without verification is **not** a passed recovery drill.

## Minimum verification after restore
- all canonical operational tables exist;
- RLS enabled on every protected table;
- `anon` cannot read protected rows;
- resident cannot read operational/private rows;
- committee cannot read `staff_private`;
- concierge cannot broadly manage shifts or staff;
- mayordomo/administrator permissions match the approved matrix;
- cross-community isolation remains intact;
- shift and incident revision triggers work;
- audit/domain event triggers append correctly;
- no DELETE privilege appears on append-only/history tables;
- synthetic smoke workflow passes before any real traffic is pointed at the restored target.

## Storage/Auth/other services
Database dumps are not a complete Supabase project clone. If ORBI later uses Storage, Edge Functions, OAuth providers, custom SMTP, custom domains or similar services, each must have its own recovery/configuration procedure. Their secrets and provider credentials are not to be stored in this public repository.

## Free-plan limitation and production recommendation
The Free plan is adequate for the present synthetic staging phase. Before real condominium data is enabled, reassess the Supabase plan because production recovery and Auth controls are materially stronger on paid tiers. In particular, current Supabase documentation places leaked-password protection on Pro and above, and automatic backup capabilities differ by plan.

Do not upgrade solely to satisfy this document without explicit budget approval.

## Paid disposable branch option
A Supabase development branch could be useful for an isolated restore/security drill, but the current organization quote observed for a branch is **$0.01344/hour**. Creating a paid branch requires explicit cost confirmation and is intentionally not automated by this runbook.

## P1E gate
P1E is complete only when all are true:
- logical backup has been generated from staging using the supported CLI;
- hashes and private backup register entry exist;
- backup is stored outside Git and outside the application host;
- a restore to an independent target has completed;
- ORBI security/integrity smoke tests pass on the restored target;
- recovery time and issues are recorded;
- owner/responsible person and recurrence are agreed;
- production plan/backups/password/MFA controls are explicitly decided before real PII.

Until then, status is **RECOVERY DESIGNED, RESTORE NOT YET PROVEN**.
