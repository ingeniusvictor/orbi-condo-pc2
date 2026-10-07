# Deployment — ORBI Condo PC2

## Target
- Repository: `ingeniusvictor/orbi-condo-pc2`
- Branch: `main`
- Framework: Next.js
- Intended Vercel team: `orbi4`
- Suggested Vercel project: `orbi-condo-pc2`

## Build contract
```bash
npm install
npm run check
```

`npm run check` executes TypeScript validation and the production Next.js build. GitHub Actions enforces the same gate on `main`.

## Runtime requirements
No database, authentication service, API secret or environment variable is required for the current showcase.

## Current deployment blocker
The connected deployment tool received HTTP 403 while attempting to create the Git-linked project in the intended Vercel team. The repository itself is healthy and continues to pass GitHub quality gates. Do not work around the permission failure by creating an unrelated Vercel project or changing team scope without explicit review.

## When access is available
1. Import `ingeniusvictor/orbi-condo-pc2` into Vercel team `orbi4`.
2. Keep framework auto-detection as Next.js.
3. Use `main` as the production branch.
4. No environment variables are needed for the showcase.
5. Confirm preview build is GREEN.
6. Verify desktop and mobile layouts before promoting production.
7. Keep search-engine indexing disabled during committee/presentation review.

## Media note
The current exterior images are prototype remote references. Before a formal public/commercial launch, replace them with community-owned, licensed or explicitly authorized media.
