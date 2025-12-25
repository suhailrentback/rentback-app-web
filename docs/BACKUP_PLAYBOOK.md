# RentBack – Backup & Restore Playbook

## Backups
- Supabase:
  - Enable PITR/automated backups per plan.
  - Take a manual snapshot before schema migrations.

## Restore (Disaster)
1. Pause writes (put app in maintenance or disable key routes).
2. Restore target DB snapshot (Supabase UI or support).
3. Run migrations forward to desired state if required.
4. Regression test core flows (auth, invoices, payments).
5. Re-enable writes.

## Exports
- Periodically export critical tables to storage for cold backups.

_Last reviewed: {{TODAY}}_
