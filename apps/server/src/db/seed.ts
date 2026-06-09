// apps/server/src/db/seed.ts
// Idempotent seed script — inserts 4 preset rows on first run, no-op on subsequent runs.
// Run with: pnpm --filter nl-layouter-server seed
//
// TRUST BOUNDARY: htmlContent strings below are developer-authored HTML.
// They are NOT user-submitted. dangerouslySetInnerHTML is safe for this data.
import { db } from './connection.js';
import { presets } from './schema.js';

const SEED_PRESETS = [
  {
    id: 'header-minimal-logo',
    type: 'header',
    name: 'Minimal Logo',
    htmlContent: '<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;text-align:center;"><tr><td><span style="font-size:22px;font-weight:700;color:#0066cc;font-family:Arial,sans-serif;">Your Brand</span></td></tr></table>',
    thumbnail: null,
  },
  {
    id: 'header-logo-banner',
    type: 'header',
    name: 'Logo + Banner',
    htmlContent: '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0066cc;padding:24px;text-align:center;"><tr><td><span style="font-size:22px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">Your Brand</span><p style="color:#cce0ff;font-size:14px;margin:8px 0 0;">Newsletter \u2014 June 2026</p></td></tr></table>',
    thumbnail: null,
  },
  {
    id: 'footer-simple-links',
    type: 'footer',
    name: 'Simple Links',
    htmlContent: '<table width="100%" cellpadding="0" cellspacing="0" style="padding:16px 0;text-align:center;border-top:1px solid #e0e0e0;"><tr><td style="font-family:Arial,sans-serif;font-size:12px;color:#666;"><a href="#" style="color:#0066cc;text-decoration:none;">Unsubscribe</a> &nbsp;&#183;&nbsp; <a href="#" style="color:#0066cc;text-decoration:none;">Privacy Policy</a></td></tr></table>',
    thumbnail: null,
  },
  {
    id: 'footer-address-unsubscribe',
    type: 'footer',
    name: 'Address + Unsubscribe',
    htmlContent: '<table width="100%" cellpadding="0" cellspacing="0" style="padding:16px 0;text-align:center;border-top:1px solid #e0e0e0;"><tr><td style="font-family:Arial,sans-serif;font-size:12px;color:#666;"><p style="margin:0 0 8px;">Your Company &#183; 123 Street &#183; City, ST 00000</p><a href="#" style="color:#0066cc;text-decoration:none;">Unsubscribe</a></td></tr></table>',
    thumbnail: null,
  },
];

async function seed() {
  await db
    .insert(presets)
    .values(SEED_PRESETS)
    .onConflictDoNothing(); // idempotent — safe to run multiple times; PK conflict = no-op
  console.log(`Seeded ${SEED_PRESETS.length} presets`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
