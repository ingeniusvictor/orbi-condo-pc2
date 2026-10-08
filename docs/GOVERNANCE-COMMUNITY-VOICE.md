# OC-PC2-18/19 — Governance and Community Voice prototype

Three roles only: administrator, committee, resident. Administrator proposes and applies approved changes. Committee reviews and approves. Resident views authorized data and answers consultative surveys.

The prototype uses client-side React state only. Role selector is a demonstration, **not authentication or access control**. No persistent edits, real responses, emails or invitations.

Domain helpers in lib/governance.ts and lib/community-voice.ts define preliminary policies, approval separation, survey validation and deterministic tally. They are **not** server enforcement.

Before enabling live operation:
1. Implement authentication and membership/role mapping scoped by community, enforced server-side on every mutation and read.
2. Database transactions and append-only audit trail, committee decisions and documented approval thresholds; ensure administrative actions cannot impersonate committee.
3. Survey draft -> committee approval -> administrator publication -> close. Enforce response eligibility and uniqueness transactionally, using user or unit-based identity depending on the consultation; protect against multiple devices.
4. Publish clear privacy policy, access control, retention, optional anonymous aggregation and anti-reidentification safeguards.
5. Distinguish consultative surveys from formal legally binding votes under Chilean coproperty law; do not represent this module as a formal voting mechanism.
6. Notification outbox, scheduled reminders, retries, verified addresses, preferences and idempotent delivery.

No invented PC2 maintenance schedule or survey participation data is stored.
