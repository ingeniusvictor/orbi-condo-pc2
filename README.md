# ORBI Condo · Parque Ciudadano II

Premium showcase and product seed for a clearer, more visual way to understand condominium maintenance and community operations.

## Product goal
Turn a traditional maintenance calendar into an experience that residents can understand instantly — while keeping the technical information traceable and ready to grow into a broader operations platform.

Parque Ciudadano II is the first implementation, not the architectural limit.

## Current experience
- Cinematic PC2 hero with real-project visual references.
- Source-backed community identity (278 homes, DS19, Rancagua).
- Maintenance rhythm dashboard.
- Before/after transformation story: spreadsheet → ORBI Condo.
- Filterable maintenance-system cards.
- Custom ORBI vector iconography for technical systems.
- Interactive system detail drawer.
- Annual frequency overview.
- Provider directory with verified/unverified separation.
- Certifications/status area.
- Community ecosystem map using publicly listed PC2 amenities.
- Floating app-style navigation.
- Responsive desktop/mobile treatment.
- Reduced-motion support.
- `noindex` while the concept is in presentation stage.

## Data integrity
The showcase intentionally distinguishes between:
1. data from the original PC2 maintenance calendar;
2. information verified from official/public sources;
3. prototype presentation choices.

See [`docs/SOURCE-REGISTER.md`](docs/SOURCE-REGISTER.md).

## Architecture
Community information is isolated from the UI in `data/community.ts` and typed by `data/types.ts`. This keeps the first implementation light while preparing the codebase for future communities.

```text
app/          presentation and global styles
components/   reusable visual/interaction components
data/         community domain model and PC2 data
docs/         roadmap and source governance
```

## Stack
- Next.js 16
- React 19
- TypeScript
- Framer Motion
- GitHub Actions quality gate

## Local development
```bash
npm install
npm run dev
```

Validation:
```bash
npm run check
```

`check` runs TypeScript validation followed by the production build.

## Current milestone
**OC-PC2-09 — Structured Community Foundation**

Next focus: presentation QA, real-media hardening, deployment and feedback from the first live demonstration.

Powered by ORBI Ecosystem.
