# OC-PC2-17 — Maintenance Alerts Foundation

## Scope
Pure deterministic date evaluation plus a strictly fictional interactive demo. No persistent work orders, email, push, WhatsApp, user accounts or notification delivery is implemented.

## Operational model
An event requires communityId, assetId, dueDate, id and optional completedAt/cancelledAt. Frequency alone never creates a due date. On-demand systems only enter the alert pipeline after an authorized work order establishes a due date.

Evaluation uses calendar-day differences in a configured IANA timezone (default America/Santiago), not elapsed 24-hour intervals. Lead days default to 30/7/1; due today always alerts; overdue alerts repeat at a configurable day interval. Closed/cancelled events never alert.

## Production prerequisites
- Authenticated roles and community-scoped permissions, verified recipient addresses and opt-in/operational communication policy.
- Durable database for work orders, completion evidence, preferences, alert ledger and acknowledgement/escalation audit.
- Cron worker with concurrency lock, transactional idempotency by (event, local date, level, recipient, channel), retries and rate limits.
- Secure email provider credentials server-side, unsubscribe/preferences where applicable, bounce handling and logs with limited retention.
- Delivery separation: alert evaluation is pure; a sender must never trust demo events.
- Date validation and tests for leap days, month boundaries, DST, completion, cadence, deduplication and multi-community isolation.

## Important
All visible demo dates refer to April 2030 and are not operational facts about Parque Ciudadano II. No live alert delivery is enabled.
