// lib/server/audit.ts
import 'server-only';
import { createRouteSupabase } from '@/lib/supabase/server';

export type AuditAction =
  | 'invoice.create'
  | 'invoice.update'
  | 'payment.create'
  | 'payment.confirm'
  | 'profile.role.update';

type Supa = ReturnType<typeof createRouteSupabase>;

export async function writeAuditLog(opts: {
  supabase?: Supa | null;
  actorId?: string | null;
  entityTable: string;      // e.g., 'invoices'
  entityId: string;         // row id
  action: AuditAction | string;
  metadata?: Record<string, any> | null;
}) {
  try {
    const sb = opts.supabase ?? createRouteSupabase();

    // Resolve the actor (current auth user) if not provided
    let actorId = opts.actorId ?? null;
    if (!actorId) {
      const { data } = await sb.auth.getUser();
      actorId = data.user?.id ?? null;
    }

    // Insert audit row (ignore failure to avoid breaking main flow)
    await sb.from('audit_log').insert({
      actor_id: actorId,
      entity_table: opts.entityTable,
      entity_id: opts.entityId,
      action: opts.action,
      metadata: opts.metadata ?? null,
    });
  } catch (e) {
    // Don’t throw—just log. Audit must never break product flows.
    console.warn('[audit] writeAuditLog failed:', e);
  }
}
