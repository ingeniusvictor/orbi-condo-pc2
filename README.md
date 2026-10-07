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
- Source-faithful annual frequency overview.
- Provider directory with verified identity enrichment.
- Certifications/status area.
- Community ecosystem map using publicly listed PC2 amenities.
- “PC2 en tu bolsillo” resident mobile-experience showcase.
- Floating app-style navigation.
- Responsive desktop/mobile treatment.
- Reduced-motion support.
- Basic response-security headers.
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
docs/         roadmap, deployment and source governance
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
**OC-PC2-12 — Presentation Hardening**

Deployment instructions: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)  
Presentation gate: [`docs/PRESENTATION-CHECKLIST.md`](docs/PRESENTATION-CHECKLIST.md)

Next focus: final responsive QA, licensed/owned media hardening, Vercel deployment and first controlled presentation feedback.

Powered by ORBI Ecosystem.
