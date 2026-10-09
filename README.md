# Aurelle — retail storefront and admin demo

A premium women’s western wear prototype built with Next.js 16.4, TypeScript, Tailwind CSS 4, and a connected local SQLite database.

## Before and after

Before: no retail website or admin demonstration.
After: customers browse, save products, choose sizes, and place demo orders. Admin manages products, stock, and fulfilment. Both use the same database.

Project location: F:\westernwear-retail-demo. Synced ChatGPT reference files and other F: projects are untouched.

## Open the demo

- Store: http://127.0.0.1:3000
- Admin: http://127.0.0.1:3000/admin
- Email: admin@aurelle.demo
- Password: AurelleDemo2026!

These credentials are for a local demonstration. Payments, deliveries, contact details, and policies are simulations. No payment details are collected.

## Start it again

Open a terminal in this project:

```powershell
cd 'F:\westernwear-retail-demo'
npm ci
npm run seed
npm run build
npm run start
```

The server binds to this computer only. Open http://127.0.0.1:3000. Keep the terminal running while presenting. Stop with Ctrl+C.

For editing, use `npm run dev` instead. The installed Node.js 22.13.0 was verified. Keep the pinned better-sqlite3 version: 13.0.3 crashed on this runtime, so this project uses tested version 12.11.1.

Optional settings are documented in `.env.example`. Copy it to `.env.local` if needed. `DEMO_DB_PATH` chooses the local database, `DEMO_ADMIN_PASSWORD` changes the demo password, and `DEMO_HTTPS` enables secure cookies only when actually served over HTTPS. Standalone seed/reset scripts read shell environment variables, not `.env.local`; pass a custom database path in the shell when using these scripts.

## Features

- Responsive campaign homepage and five clothing categories.
- 24 sample catalogue entries, search, URL filters, sorting, sale and sold-out examples.
- Local product photos; gallery/detail crop; size guide; size, quantity, and colour display.
- Browser-persistent cart and wishlist; guest Indian address checkout.
- ₹99 delivery, complimentary at a ₹1,999 merchandise subtotal.
- Cash-on-delivery and simulated successful/declined online payments.
- Server-validated prices and stock, transactional reservations, duplicate-request protection.
- Private order confirmation/status pages with unpredictable tokens.
- Admin dashboard, product creation/editing, size stock, archiving/restoration, image-library selection.
- Orders, search/filter, customer details, forward fulfilment status updates, pre-shipment cancellation.
- Cancellation returns stock once; payment and fulfilment status stay separate.
- Loading, empty, error, and success states; keyboard dialogs and mobile navigation.

Data is saved in `data/aurelle.sqlite`. Browser storage is used only for the cart and wishlist. Admin edits appear in another browser after refresh. Orders preserve the purchased name, colour, price, and size even if the product later changes.

## Reset for another client presentation

```powershell
npm run demo:reset
```

This restores the selected demo database to 24 products and 3 sample orders and removes admin sessions. It does not affect another project. Use the storefront footer’s **Clear my demo data** button to clear this browser’s bag and wishlist. Avoid resetting during an active checkout.

For a custom database:

```powershell
$env:DEMO_DB_PATH = 'data/my-demo.sqlite'
npm run demo:reset
npm run start
```

## Quality checks

```powershell
npm run lint
npm run typecheck
npm run build
npm run test:commerce
npx playwright install chromium
npm run test:e2e
```

Lint treats warnings as failures. TypeScript uses strict checking, and explicit `any` is prohibited. External form/storage values are validated before use.

Commerce tests use isolated databases under `data/commerce-tests-*`. Browser tests reset only `data/e2e.sqlite` and start a separate production server on port 3100. Keep that port free. Tests never reset the client presentation database. Screenshots are saved under `artifacts/`; the browser report is under `playwright-report/`.

See `docs/QUALITY-CHECKS.md` for final results and `docs/CLIENT-WALKTHROUGH.md` for the presentation script.

## What remains for a real launch

Replace sample brand/catalogue photos and support details; confirm prices, product materials, sizing, taxes, and policies. Add real payments, shipping, refunds/returns, communications, production authentication, and hosting as a separate stage. The five photographed designs are reused across labelled demo “Edit” catalogue entries; they are not 24 distinct real garments.

This local prototype intentionally has no customer account system, uploads, courier integrations, emails/SMS, GST invoices, reviews, or analytics service. Private order links must be kept private.

Dependency audit reports five transitive advisories in the Next.js ESLint tooling chain, not runtime dependencies. `npm audit --omit=dev` is clean. These are recorded without downgrading Next.js or applying breaking automatic changes.

## Reference material

- docs/RESEARCH.md — 15 staged research queries and implementation decisions.
- docs/IMAGE-CREDITS.md — local photograph sources and licence.
- docs/CLIENT-WALKTHROUGH.md — five-minute presentation.
- docs/QUALITY-CHECKS.md — verification evidence.
