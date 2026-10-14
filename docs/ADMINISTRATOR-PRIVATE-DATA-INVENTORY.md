# ORBI LIVING — Administrator private-data inventory

## Status
**Technical inventory draft · SYNTHETIC STAGING ONLY · Administrator-only working cut.**

This document inventories the current private operational schema and browser projection. It does **not** authorize real PC2 data, set a final legal retention schedule, or close the production privacy gate. Final purpose/retention/correction/audit handling still requires explicit administrative and legal/privacy review before real data is enabled.

The inventory was reconciled against the current staging `information_schema` and repository migrations. No row contents or real personal data were queried.

## Classification rules
- **Tenant metadata** — identifies the condominium/system context; not intended as person-level data.
- **Auth linkage** — UUID that links an operation to an authenticated account. Pseudonymous in the operational database but person-related once joined to Auth/account records.
- **Staff identity / workforce data** — person-level employment/coverage information. Treat as private.
- **Operational record** — structured scheduling, incident, bitácora or round state. It may become person-related when linked to staff/auth identifiers.
- **Opaque case reference** — restricted token for cross-referencing a case; must never contain names, RUTs, phones, email addresses, apartment narratives or free text.
- **Audit evidence** — immutable/append-only accountability information. Potentially person-related through actor IDs and timestamps.
- **Prohibited narrative** — free-text field whose use with real data is not approved in the current product cut.

## Exact current field inventory

### `communities`
Purpose: tenant boundary and basic deployment context.

Fields: `id`, `display_name`, `timezone`, `active`, `created_at`.

Classification: tenant metadata. No resident/staff PII is intended here.

### `memberships`
Purpose: bind an authenticated account to one community and one operations role.

Fields: `user_id`, `community_id`, `operations_role`, `active_from`, `active_until`, `disabled_at`, `created_at`.

Classification: `user_id` is auth linkage; activation windows and role are private access-control metadata. Current live scope uses Administrator only. Other role values remain contractual definitions, not authorization to provision live identities.

### `staff_private`
Purpose: minimal private workforce catalog used to plan coverage.

Fields: `id`, `community_id`, `display_name`, `staff_function`, `coverage_eligible`, `active`, `created_at`, `updated_at`.

Classification:
- `display_name` — direct staff identity when real data is introduced;
- `staff_function`, `coverage_eligible`, `active` — private workforce/availability metadata;
- `id` — internal staff identifier;
- timestamps/community — operational metadata.

Current RLS permits private staff catalog access only to roles defined for schedule management; in the active live cut, only Administrator is provisioned/certified. The current Administrator dashboard selects only `id`, `display_name`, `staff_function` for active coverage-eligible staff.

Not present by design: RUT, phone, personal email, home address, bank/payroll data, medical data, contract file, salary, free-text notes.

### `shift_assignments`
Purpose: structured schedule/coverage state.

Fields: `id`, `community_id`, `service_date`, `slot_code`, `starts_at`, `ends_at`, `assignee_staff_id`, `status`, `revision`, `created_by`, `updated_by`, `created_at`, `updated_at`.

Classification:
- `assignee_staff_id` — workforce linkage;
- `created_by`, `updated_by` — auth linkage/audit attribution;
- dates/times/status — operational record and potentially person-related when an assignee exists;
- remaining IDs/revision — internal operational metadata.

Browser minimization: the Administrator dashboard reads `assignee_staff_id` server-side only to emit `hasAssignee: boolean`; the staff UUID is not returned in the dashboard shift projection.

### `shift_events`
Purpose: append-only transition history for shift coverage.

Fields: `id`, `shift_assignment_id`, `community_id`, `event_type`, `from_status`, `to_status`, `from_assignee_staff_id`, `to_assignee_staff_id`, `reason_code`, `note_private`, `actor_user_id`, `created_at`.

Classification:
- assignee IDs — workforce linkage;
- `actor_user_id` — auth linkage/audit attribution;
- statuses/event/reason/time — audit/operational evidence;
- `note_private` — **PROHIBITED NARRATIVE for real data in the current cut**.

`note_private` is a historical schema field. The current Administrator dashboard does not select or return it. No approval exists to place real incident/person narratives in this field. Before real data is enabled, choose one of: remove/deprecate it, constrain it to a closed vocabulary, or approve a separately governed narrative-data policy. Until then its allowed real-data use is **none**.

Browser minimization: recent shift activity omits `from_assignee_staff_id`, `to_assignee_staff_id` and `note_private`.

### `incidents`
Purpose: structured operational incident case state without narrative details.

Fields: `id`, `community_id`, `service_date`, `area`, `priority`, `state`, `assigned_role`, `private_case_reference`, `revision`, `created_by`, `updated_by`, `created_at`, `updated_at`.

Classification:
- `created_by`, `updated_by` — auth linkage;
- `private_case_reference` — opaque case reference, private;
- area/priority/state/role/date — structured operational record;
- IDs/revision/timestamps — operational metadata/audit linkage.

Input boundary: case references are currently limited to a short restricted-character token and are not a narrative field. Do not encode names, RUTs, phones, unit descriptions or incident narratives into the token.

Browser minimization: the Administrator dashboard does not select or return `private_case_reference`.

### `incident_events`
Purpose: append-only incident state/priority transition history.

Fields: `id`, `incident_id`, `community_id`, `event_type`, `from_state`, `to_state`, `from_priority`, `to_priority`, `actor_user_id`, `created_at`.

Classification: structured audit/operational evidence; `actor_user_id` is auth linkage. No narrative field exists.

### `audit_events`
Purpose: accountability trail for controlled operational mutations.

Fields: `id`, `community_id`, `actor_user_id`, `action`, `resource_type`, `resource_id`, `result`, `correlation_key`, `metadata`, `created_at`.

Classification: audit evidence. `actor_user_id` is auth linkage. `resource_id`/`correlation_key` are internal references. `metadata` must remain structured operational metadata only; it is **not an approved PII or narrative container**.

Current RLS makes this an Administrator-only read surface. No delete grant is part of the operational design.

### `shift_logs`
Purpose: structured opening/closure evidence for a shift handoff/bitácora.

Fields: `id`, `community_id`, `shift_assignment_id`, `state`, `opened_by`, `opened_at`, `closed_by`, `closed_at`, `closure_code`, `access_control_status`, `equipment_status`, `open_incidents_reviewed`, `pending_items_count`, `revision`, `updated_by`, `created_at`, `updated_at`.

Classification:
- `opened_by`, `closed_by`, `updated_by` — auth linkage;
- all remaining status/count/timestamp fields — structured operational/audit record.

No free-text narrative is present. Closed logs are immutable under the current database contract.

### `shift_log_entries`
Purpose: append-only structured bitácora entries.

Fields: `id`, `shift_log_id`, `community_id`, `entry_code`, `category`, `severity`, `incident_id`, `case_reference`, `actor_user_id`, `created_at`.

Classification:
- `actor_user_id` — auth linkage;
- `incident_id` — internal case linkage;
- `case_reference` — opaque case reference;
- entry/category/severity/time — structured operational/audit evidence.

No narrative field is present. `case_reference` is format-constrained and must remain an opaque token.

### `operational_rounds`
Purpose: structured ronda lifecycle tied to an open shift log.

Fields: `id`, `community_id`, `shift_log_id`, `round_type`, `state`, `started_by`, `started_at`, `completed_by`, `completed_at`, `revision`, `updated_by`, `created_at`, `updated_at`.

Classification: structured operational/audit record; `started_by`, `completed_by`, `updated_by` are auth linkages. Completed rounds are immutable under the current database contract.

### `operational_round_checks`
Purpose: append-only structured checkpoint evidence.

Fields: `id`, `community_id`, `round_id`, `checkpoint_code`, `result`, `incident_id`, `case_reference`, `actor_user_id`, `created_at`.

Classification:
- `actor_user_id` — auth linkage;
- `incident_id` — internal case linkage;
- `case_reference` — opaque case reference;
- checkpoint/result/time — structured operational/audit evidence.

No narrative field is present.

## Browser/API minimization contract for Administrator
The current `/api/operations/dashboard` projection intentionally does less than the database can store:

- shifts expose `hasAssignee` rather than the assigned staff UUID;
- incidents omit `private_case_reference`;
- recent shift events omit old/new assignee UUIDs and `note_private`;
- recent incident events expose structured state/priority transitions only;
- the staff catalog is limited to `id`, `displayName`, `staffFunction` for active coverage-eligible candidates;
- all responses remain private/no-store under the runtime security contract.

The private staff ID is currently returned only in the Administrator staff catalog because schedule-management commands need a stable identifier for selecting an assignee. This is an internal identifier, not a public/person-facing identifier.

## Data that is explicitly out of the current schema/product cut
Do not add or load any of the following without a new privacy/security review and explicit scope decision:

- resident names/contact lists/unit-resident linkage;
- RUT or passport/identity-document data;
- personal phone numbers or private email addresses;
- vehicle plates;
- employee salary/payroll/overtime/bank data;
- medical/health information;
- contract PDFs or identity-document images;
- CCTV images/video/biometric data;
- unrestricted incident narratives;
- passwords, session tokens, refresh tokens or API secrets;
- any real data copied from contracts or condominium files merely because source documents exist.

## Retention status
No final real-data retention periods are approved yet. Until that decision is made:

- synthetic staging data may remain only as QA fixtures required for reproducible tests;
- no real PII is permitted;
- append-only/audit semantics in the schema are technical integrity controls, **not** a final legal retention schedule;
- Production must not infer a retention period from database immutability alone.

Before real data, Administration must approve a retention matrix for at least: workforce catalog, schedule/coverage history, incidents, shift logs/entries, rounds/checks, and audit events.

## Correction / deactivation status
Technical mechanisms already exist for `staff_private.active`, `memberships.disabled_at`, and role activation windows, but the human procedure for who may correct/deactivate real staff/access records is not yet approved. That remains a production blocker.

## Audit-access status
`audit_events` is technically restricted to Administrator. Final rules for who is permitted to inspect/export audit evidence, how long it is retained, and how access itself is reviewed are not yet approved.

## Decisions still required before real data
1. Approve the exact business purpose for each person-related field above.
2. Approve retention/deletion/archive periods by record family.
3. Approve staff/access correction and deactivation procedure.
4. Approve audit access/export/retention procedure.
5. Decide the fate of `shift_events.note_private` before any real data.
6. Approve private-document storage separately if documents ever enter scope.
7. Review the production privacy/internal-handling procedure for Chilean operation.

Until these decisions are recorded, the gate remains:

**ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY · NO REAL PII · PRODUCTION BLOCKED**.
