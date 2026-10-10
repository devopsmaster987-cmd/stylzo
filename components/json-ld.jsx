import { headers } from 'next/headers';

// JSON-LD data blocks. Next.js applies the request nonce to its own scripts;
// the blocks are inert data but are marked with the same nonce for CSP parity.
export async function JsonLd({ items }) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;
  const nonce = (await headers()).get('x-nonce') || undefined;
  return list.map((json, i) => (
    <script
      key={i}
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  ));
}