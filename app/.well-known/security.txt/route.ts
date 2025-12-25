export function GET() {
  const body = [
    'Contact: mailto:help@rentback.app',
    'Policy: https://rentback.app/security',
    'Preferred-Languages: en',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
