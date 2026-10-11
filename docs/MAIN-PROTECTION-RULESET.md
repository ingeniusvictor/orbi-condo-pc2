# ORBI LIVING — Two-Phase `main` Protection Ruleset

## Purpose

This document defines the repository-level protection required for the stacked P1 consolidation and the stricter final state after #58 is integrated.

It does **not** authorize merging, production, real data, P1E completion or P2 notifications.

## Why protection must be two-phase

The canonical P1 line is a real stacked PR chain. Each child PR is based on the exact head of its predecessor, but the Quality Gate job names evolved over time.

Therefore a single final required-check policy cannot safely be applied before #27 is merged:

- early PRs do not emit the final Node 22 / Node 24 job names;
- requiring final job names during #27 → #57 would deadlock otherwise valid historical PRs;
- every historical merge must still be manually blocked unless its own Quality Gate is GREEN.

Protection is therefore split into two explicit modes.

## Mode 1 — Consolidation

Use while integrating #27 → #57 and then #58 itself.

Ruleset intent:

1. target only `refs/heads/main`;
2. enforcement active;
3. zero bypass actors;
4. block branch deletion;
5. block non-fast-forward / force pushes;
6. require pull requests;
7. allow **merge commit only**;
8. require review conversations to be resolved;
9. approving review count remains 0 for this single-maintainer repository;
10. **no fixed required status-check contexts yet**.

The absence of fixed required contexts during this historical stack does **not** waive CI. Before each merge, manually verify that PR's actual Quality Gate is GREEN after retargeting to `main`.

## Why merge commit only

Squash or rebase would rewrite/remove predecessor ancestry from `main`, causing later stacked PRs to re-show already-integrated changes after retargeting. Merge commits preserve the chain.

## Mode 2 — Final

After #58 is integrated and `main` has the final workflow, update the same ruleset to require these ASCII-stable GitHub Actions checks:

- `Full contract - Node 22`
- `Vercel runtime parity - Node 24`

Both are pinned to the official GitHub Actions integration (`integration_id: 15368`).

Do **not** require the external status context named `Vercel`; provider quota failures such as Hobby `build-rate-limit` are not application-quality failures.

## Windows PowerShell 5.1 compatibility

The helper intentionally uses ASCII for ruleset/check names and writes the JSON body through explicit UTF-8-no-BOM file IO before passing it to `gh api`.

This avoids the mojibake observed when Windows PowerShell 5.1 converted `·` into `??` while piping JSON.

The helper is idempotent: it detects an existing ORBI LIVING main-protection ruleset and updates it rather than attempting a duplicate POST.

## Safe helper — Consolidation mode

Dry run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\configure-main-ruleset.ps1"
```

Apply:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\configure-main-ruleset.ps1" -Apply
```

Expected mode: `Consolidation`.

The helper verifies the repository, default branch and reviewed `main` baseline unless drift is deliberately acknowledged after re-audit.

## Final hardening after #58 merge

Once the final canonical `main` SHA is known, dry-run final mode using that exact SHA:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\configure-main-ruleset.ps1" -Mode Final -ExpectedMainSha "<FINAL_MAIN_SHA>"
```

Then apply only after the payload is reviewed:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\configure-main-ruleset.ps1" -Mode Final -ExpectedMainSha "<FINAL_MAIN_SHA>" -Apply
```

## Current recovery from the first apply attempt

A ruleset was successfully created before a duplicate-create retry returned HTTP 422. Its current GitHub id is `24866000`.

That ruleset must be updated before any merge because Windows PowerShell 5.1 corrupted the original middle-dot characters in both the ruleset name and required check names.

The corrected helper recognizes the existing ORBI LIVING protection rule even with its mojibaked display name and updates it in place.

## Historical PR outside the stack

PR #22 remains Draft and outside the #27 → #58 consolidation. Its aggregated workforce view is not silently discarded.

PR #37 remains closed without merge and superseded; never revive it as part of this stack.

## Status

**TWO-PHASE PROTECTION DEFINED · WINDOWS POWERSHELL 5.1 SAFE · IDEMPOTENT UPDATE · NO AUTO-MERGE · NO PRODUCTION**
