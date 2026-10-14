# ORBI LIVING — Administrator browser UI QA

## Scope

This gate certifies the authenticated `/operaciones` workspace with the existing **synthetic Administrator** only.

It does not create additional roles, does not enable real PC2 data, does not mutate operational records, does not create a production backend, and does not approve Production.

## Browser coverage

The manual GitHub Actions workflow `.github/workflows/admin-ui-qa.yml` runs Chromium against an explicitly supplied ORBI LIVING Vercel Preview origin.

Canonical viewports:

- 390×844
- 430×932
- 768×1024
- 1440×900
- 1920×1080

## Required checks

The browser runner must fail closed when any of these conditions is not met:

- target is not the exact approved ORBI LIVING `orbi4` Preview hostname pattern;
- Production hostname is supplied;
- protected Preview access cannot be established;
- email input is not keyboard reachable;
- email, password or login submit controls lack visible keyboard focus;
- Administrator login does not reach the private workspace;
- visible controls in `main` lack a semantic accessible name;
- document/body overflow horizontally at any canonical viewport;
- private controls escape the viewport;
- mobile buttons fall below the 44 px touch-target contract;
- main heading is missing or clipped;
- logout does not return to the private login boundary.

## Read-only operational policy

Browser QA may authenticate and log out, but must not issue operational mutation commands. It must not click or call:

- shift command/report-gap/handoff mutations;
- incident report/command mutations;
- shift-log write/close/open mutations;
- operational-round write/complete/check mutations.

The hermetic safety test `scripts/test-admin-ui-qa-safety.mjs` enforces this boundary before merge.

## Evidence

Each run writes:

- one full-page screenshot for each canonical viewport;
- `report.json` with responsive, keyboard and accessibility results.

The workflow uploads `artifacts/admin-ui` as a short-retention GitHub Actions artifact.

## CSS contract

The private route centralizes:

- minimum 44 px height for buttons, inputs and selects;
- high-contrast `:focus-visible` styling;
- responsive single-column collapse;
- private-route overflow containment;
- safe-area bottom spacing.

## Status semantics

A GREEN browser run closes the automated Administrator responsive/keyboard baseline only.

It does **not** replace human visual review of spacing, typography, perceived contrast, visual hierarchy, or device-specific safe-area behavior. Those checks remain explicit manual QA evidence before production acceptance.

**SYNTHETIC STAGING ONLY · ADMINISTRATOR ONLY · READ-ONLY OPERATIONS · PRODUCTION BLOCKED**
