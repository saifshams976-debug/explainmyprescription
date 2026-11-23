# Roadmap — KnowDose AI Consultation

- [x] Server functions `consultationTurn` / `consultationReport` (auth-gated, input caps, emergency detection)
- [x] DB table `consultation_reports` (save/delete reports, RLS per user)
- [x] `/consultation` route: consent → chat thread → report view → saved reports
- [x] Nav links (header dropdown + homepage card)
- [x] i18n keys (en; other languages fall back)
- [x] Verified in preview: chat flow, quick replies, report, save/delete, emergency 999 banner

## Guest access
- [ ] Add temporary guest sessions and protected guest AI access without creating accounts.
- [ ] Add guest option to sign-in, homepage, DoseAI and comparison; keep account saves private.
- [ ] Verify guest prescription, chat/report and comparison flows, security checks, and mobile layout.
