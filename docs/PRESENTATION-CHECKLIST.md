# PC2 Showcase — Presentation Checkpoint

The showcase is presentation-ready only when every item below is true.

## Visual impact
- Hero immediately identifies Parque Ciudadano II.
- Real-project imagery is sharp and legible behind copy.
- ORBI branding is visible but does not overpower the community identity.
- Maintenance cards feel like product UI, not a spreadsheet recreation.
- Mobile phone showcase reads correctly at narrow widths.
- Before/after story can be understood without explanation.

## Data integrity
- Maintenance systems, frequencies and provider names match the PC2 source calendar.
- Certification wording matches the source document.
- No system is shown as completed/pending/current unless the exact source state has been validated.
- Provider enrichment is separated from source-calendar data.
- Public project facts have traceable evidence in `docs/SOURCE-REGISTER.md`.

## Interaction
- Filters work for all maintenance frequencies.
- Every technical-system card opens the correct detail drawer.
- Drawer closes through its visible close control and backdrop.
- Floating navigation reaches the intended sections.
- External provider links open safely in a new tab.

## Responsive QA
Test at minimum:
- 390 × 844
- 430 × 932
- 768 × 1024
- 1440 × 900
- 1920 × 1080

## Technical
- `npm run check` passes.
- GitHub Actions Quality Gate is GREEN.
- No required environment variables.
- No console-breaking runtime errors.
- Reduced-motion preference remains usable.
- Search indexing remains disabled until formal launch approval.

## Commercial launch gate
Before public promotion beyond the controlled demonstration:
- Replace prototype remote photos with owned/licensed/authorized media.
- Confirm any provider logos/brand assets before use.
- Confirm the committee-approved maintenance calendar and certification statuses.
- Add a live URL/QR only after Vercel deployment is verified.
