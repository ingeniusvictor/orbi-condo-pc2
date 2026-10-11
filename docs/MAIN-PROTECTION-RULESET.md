# ORBI LIVING — Exact `main` Protection Ruleset

## Purpose

This document defines the repository-level protection required before the stacked P1 consolidation begins.

It does **not** authorize merging. It exists because read-only inspection found that `main` currently has no branch protection and the repository has no rulesets.

## Why merge commit only

The canonical P1 line is a true stacked PR chain. Each child PR is based on the exact head of its predecessor.

During the #27 → #58 consolidation window, use **merge commits only**. Squash or rebase would rewrite/remove the predecessor ancestry from `main`, which can make the next stacked PR show already-integrated changes again after retargeting.

The repository currently allows merge commits, so no repository-wide merge-method setting needs to be changed merely for this stack.

## Required checks

The final #58 check-runs are produced by the official GitHub Actions app (`integration_id: 15368`) and are named exactly:

- `Full contract · Node 22`
- `Vercel runtime parity · Node 24`

Require those two checks.

Do **not** require the external status context named `Vercel` for this consolidation. On the reviewed #58 head that status is currently failing because of the Vercel Hobby `build-rate-limit`, while both GitHub Actions quality jobs are GREEN. A provider quota status must not be confused with an application-quality failure.

## Exact repository ruleset intent

Target only `refs/heads/main` with enforcement active.

Rules:

1. block branch deletion;
2. block non-fast-forward / force pushes;
3. require a pull request before updating `main`;
4. allow `merge` as the only merge method during the stacked consolidation;
5. require review conversations to be resolved;
6. require zero approving reviews for this single-maintainer consolidation rather than inventing an unavailable second reviewer;
7. require the two GitHub Actions checks listed above;
8. require checks to be current with the latest `main` (`strict_required_status_checks_policy: true`);
9. grant no bypass actors by default.

If a second human reviewer becomes available later, the approval count can be raised independently of this stack.

## Safe helper

Use:

```powershell
pwsh -File scripts/configure-main-ruleset.ps1
```

That is a **dry run**. It verifies:

- GitHub CLI exists and is authenticated;
- the repository is exactly `ingeniusvictor/orbi-condo-pc2`;
- the default branch is `main`;
- `main` is still at the reviewed baseline `a20c03ff9a84715772250a0daab6cd110d8235c2` unless drift is deliberately acknowledged;
- a ruleset with the intended name does not already exist.

The dry run prints the JSON payload but changes no GitHub setting.

After reviewing the payload and only while `main` is still in the approved pre-consolidation state, apply with:

```powershell
pwsh -File scripts/configure-main-ruleset.ps1 -Apply
```

The script relies on the authenticated `gh` session. No token, PAT, password or secret is stored in the repository.

If `main` moved since the audited baseline, the helper fails closed. Re-audit first. `-AllowMainDrift` exists only as an explicit operator override after that review; it must not be used merely to silence the guard.

## Verification after apply

Before any merge:

1. re-read repository rulesets;
2. confirm the ruleset is `active` and targets only `main`;
3. confirm the exact two GitHub Actions required checks;
4. confirm no external `Vercel` required check was added;
5. confirm deletion and force-push blocking;
6. confirm merge method is `merge` only;
7. confirm there are no bypass actors;
8. confirm #27 remains Draft until explicit consolidation authorization.

## Historical PR outside the canonical stack

PR #22 (`OC-PC2-37 · Privacy-safe workforce role overview`) remains open because its aggregated workforce view is not literally absorbed by #27. It has been converted to Draft and is **not** part of the #27 → #58 consolidation. Do not merge it opportunistically during this window.

PR #37 remains closed without merge and superseded; never revive it as part of this stack.

## Status

**PROTECTION PAYLOAD PREPARED · DRY-RUN BY DEFAULT · NO SECRETS · NO MERGE AUTHORIZATION · NO PRODUCTION CHANGE**
