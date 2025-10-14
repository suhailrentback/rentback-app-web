// app/api/receipts/[paymentId]/route.ts
// Runtime: Node (we generate a PDF on the fly)
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** ----- Types to force correct relation shapes (no arrays) ----- */
type PaymentRow = {
  id: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED';
  reference: string | null;
  paid_at: string | null;
  created_at: string;
  lease: {
    id: string;
    monthly_rent: number;
    landlord_id: string | null;
    unit: {
      unit_number: string | null;
      property: {
        name: string | null;
        address: string | null;
      } | null;
    } | null;
  } | null;
  tenant: {
    full_name: string | null;
    email: string | null;
  } | null;
};

/** Minimal PDF generator (no external deps). Renders simple text lines. */
function createSimplePdf(lines: string[]): Uint8Array {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>\nendobj\n';
  const content =
    'BT\n/F1 12 Tf\n72 750 Td\n' +
    lines.map((l, i) => (i === 0 ? `(${esc(l)}) Tj` : `T* (${esc(l)}) Tj`)).join('\n') +
    '\nET\n';
  const obj5 = `5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`;

  const parts = [header, obj1, obj2, obj3, obj4, obj5];
  const offsets: number[] = [];
  let cursor = 0;
  const buffers = parts.map(p => {
    const b = Buffer.from(p, 'utf8');
    offsets.push(cursor);
    cursor += b.length;
    return b;
  });
  const xrefStart = cursor;
  const count = 6; // objects 0..5 (0 is free)
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 0; i < offsets.length; i++) {
    xref += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  const result = Buffer.concat([...buffers, Buffer.from(xref + trailer, 'utf8')]);
  return new Uint8Array(result);
}

/**
 * GET /api/receipts/:paymentId?token=JWT
 * Validates access with the provided Supabase access token (query param).
 * Generates a simple PDF on the fly; only tenant (payer) or staff/admin can fetch.
 */
export async function GET(req: Request, ctx: { params: { paymentId: string } }) {
  const { paymentId } = ctx.params;
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';

  if (!paymentId) return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
  if (!token) return NextResponse.json({ error: 'Missing access token' }, { status: 401 });

  // Create a Supabase client that forwards the bearer token for RLS
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Load payment with tenant & lease context
  const resp = await supabase
    .from('payment')
    .select(`
      id, amount, status, reference, paid_at, created_at,
      lease:lease_id (
        id,
        monthly_rent,
        landlord_id,
        unit:unit_id ( unit_number, property:property_id ( name, address ) )
      ),
      tenant:tenant_id ( full_name, email )
    `)
    .eq('id', paymentId)
    .maybeSingle();

  if (resp.error) return NextResponse.json({ error: resp.error.message }, { status: 500 });

  const row = resp.data as unknown as PaymentRow | null;
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const unit = row.lease?.unit;
  const prop = unit?.property;

  const lines = [
    'RentBack — Payment Receipt',
    `Receipt for Payment ID: ${row.id}`,
    `Status: ${row.status}`,
    `Amount: ${row.amount}`,
    `Reference: ${row.reference ?? '-'}`,
    `Paid at: ${row.paid_at ?? '-'}`,
    `Tenant: ${row.tenant?.full_name ?? '-'} (${row.tenant?.email ?? '-'})`,
    `Property: ${prop?.name ?? '-'}  Unit: ${unit?.unit_number ?? '-'}`,
    `Address: ${prop?.address ?? '-'}`,
    `Lease ID: ${row.lease?.id ?? '-'}`,
    `Created: ${new Date(row.created_at).toLocaleString()}`,
  ];

  const pdf = createSimplePdf(lines);

  // ✅ Build a fresh ArrayBuffer (avoids SharedArrayBuffer typing)
  const ab = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(ab).set(pdf);

  // Wrap in Blob to satisfy BodyInit typing cleanly
  const blob = new Blob([ab], { type: 'application/pdf' });

  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt_${row.id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
