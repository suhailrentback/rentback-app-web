# RentBack – Incident Runbook

## Where to look first
- Health checks:
  - Web: `/api/health`
  - Admin: `/api/health` (admin repo)
- Vercel:
  - Check latest deploy status & logs
- Supabase:
  - Project status, auth logs, RLS panels, DB logs

## Common incidents & actions
### 1) API 5xx
- Check Vercel logs for the failing route.
- Roll back to previous green deployment if user-facing breakage.

### 2) Auth issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel envs.
- Confirm email verification & provider configs in Supabase.

### 3) Elevated errors after release
- Compare deploy diffs, revert if needed.
- Hotfix and redeploy.

## Rollback
- In Vercel, “Promote” the last green deployment.

## Contacts
- Security: security@rentback.app
- Ops: help@rentback.app

_Last updated: {{TODAY}}_
