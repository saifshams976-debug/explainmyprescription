# Architecture rules

- Guest access uses expiring HttpOnly capability cookies backed by server-only database records, not anonymous auth accounts, so account data remains isolated.
- Guest AI calls consume atomic, network-scoped and service-wide daily allowances before inference; never replace these with client-only counters.
- Preserve JWT protection on existing medication Edge Functions; guest medication requests go through the protected TanStack server proxy.
- Consultation endpoints accept a verified account bearer or a validated guest capability; saving remains account-only and RLS-protected.