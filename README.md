# King and Queen Store — connected retail demo

A working women’s western wear storefront and admin panel using Next.js 16.4, strict TypeScript, Tailwind CSS 4, and SQLite. Project: `F:\westernwear-retail-demo`.

## Before and after

| Before                       | After                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| Aurelle boutique branding    | King and Queen Store (K&G Store), local fonts, modern retail layouts                           |
| 24 repeated sample listings  | 24 distinct garments in the fresh demo catalogue                                               |
| Basic catalogue and checkout | Search suggestions, collections, filters, quick add, cart drawer, coupons, three-step checkout |
| Saved order links only       | Private browser order history, tracking, cancellation and returns                              |
| Basic product/order admin    | Multi-colour inventory, merchandising, offers, returns and support                             |

## Open the client preview

- Store: http://127.0.0.1:3001
- Admin: http://127.0.0.1:3001/admin
- Email: `admin@kgstore.demo`
- Password: `KGStoreDemo2026!`

The preview uses `data/kg-preview.sqlite`, a separate fresh catalogue. Existing data in `data/aurelle.sqlite` was preserved. Old admin sessions were invalidated during migration.

## Online demo on Vercel without a hosted database

Vercel automatically runs a **browser-only demo**. The storefront and admin share versioned browser storage, so orders, inventory, coupons, returns, product edits and support messages survive page refreshes and server restarts. No database account, connection string, new dependency, or manual environment setting is required. The existing local SQLite mode is preserved on your computer.

Use the **same browser and site address** for shopping and admin. Each browser has an independent demo store. Private order links work only in the browser that owns their saved data; copying them to another device does not transfer an order. Clearing site data or choosing Reset demo removes that browser's demo data. Use the footer's Clear my demo data control to clear the separate bag, wishlist and saved address/history.

Use sample details only. Browser data is readable/editable by its owner, and the demo admin login is an interface demonstration, not production authentication. It expires after six hours in the tab session. No customer data is submitted to a database. The browser demo holds up to 100 orders, 100 returns/messages and 200 products, and reports storage errors without claiming a successful checkout. Tabs use Web Locks where available to serialise stock changes. A hosted shared data service would be needed for a real multi-user shop.

To test this mode locally in PowerShell:

```powershell
$env:BROWSER_DEMO="1"
npm run build
npm run test:browser-demo
Remove-Item Env:BROWSER_DEMO
npm run build
```

The final build restores normal local SQLite mode. Do not set BROWSER_DEMO for regular local use. Vercel selects browser mode automatically using its existing platform environment.

## Install and start

Use Node.js 22.13 or a compatible supported Node version and npm. The SQLite driver is pinned to 12.11.1 for this Windows runtime. All images and fonts are supplied locally.

```powershell
Set-Location F:\westernwear-retail-demo
npm ci
$env:DEMO_DB_PATH = 'data/kg-preview.sqlite'
$env:PORT = '3001'
npm run build
npm run start
```

For development, use `npm run dev` after setting the same database and port variables. To use the preserved original database, set `DEMO_DB_PATH` to `data/aurelle.sqlite`. Without a database override, this original path remains the default. Next.js also reads `.env.local`; copy `.env.example` if desired and set the demo password override there. Seed/reset scripts use shell environment variables, so set `DEMO_DB_PATH` explicitly for those commands.

## Working flows

- Home, five clothing categories, New Arrivals, Featured, Sale, URL-based search/filter/sort/pagination, product galleries with zoom, size guides and related products.
- Wishlist, recent products, quick add, persistent bag, quantity limits, save-to-wishlist, delivery progress and cart drawer.
- Guest checkout: Address → Payment → Review. Indian address validation, optional remembered details, COD or simulated online payment, decline demonstration, server price/stock/coupon checks.
- `KG10`: 10% off merchandise of ₹999+, capped at ₹300. `STYLE200`: ₹200 off merchandise of ₹2,499+. One case-insensitive coupon per order. Delivery costs ₹99 below ₹1,999 merchandise, calculated before discounts.
- Private browser order history and tracking by a private code/link. Cancellation before shipping restores stock once. One whole-order return within seven days of recorded delivery; admin receipt restores stock once.
- Contact messages are saved with a reference number and handled in admin. No email is sent.
- Admin manages products, colour/size stock, featured selections, archive status, orders, fulfilment history, offer availability, returns and support.

Browser storage holds cart, wishlist, recent IDs, private order tokens and optionally remembered details. Order history itself stores no customer details. Valid `aurelle-v1` carts/wishlists migrate when a change is saved. Private order links grant access; keep them private. Every admin read/write checks an expiring HttpOnly session.

## Data and reset

Starting the application applies additive migrations and preserves existing products, slugs, variant IDs, orders, tokens and stock. The redesigned sample catalogue appears in a fresh database or after an explicit reset. Removed colour variants are deactivated, preserving order references.

The local pre-upgrade database backup is `data/backups/pre-kg-upgrade.sqlite`. Databases and backups are ignored by Git. Stop the server before manually restoring a backup.

To reset only the selected demonstration database, stop its server and run:

```powershell
$env:DEMO_DB_PATH = 'data/kg-preview.sqlite'
npm run demo:reset
npm run start
```

Reset removes orders, products, variants, product metadata, coupons, sessions, returns and support messages, then restores 24 products, two offers and three sample orders. Use “Clear my demo data” in the footer to clear browser cart, wishlist, history, recent items, coupon and remembered details. Reset the database only when intentionally discarding demo changes.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm run build
npm run test:commerce
npm run test:e2e
```

Browser tests run the production build on port 3100 with a separate `data/e2e.sqlite`; commerce/migration tests use separate temporary databases under `data`. They never reset the presentation database. Install the browser once with `npx playwright install chromium` if needed. Generated screenshots/reports are excluded from Git.

See [quality results](docs/QUALITY-CHECKS.md), [client walkthrough](docs/CLIENT-WALKTHROUGH.md), [research log](docs/RESEARCH.md) and [asset credits](docs/IMAGE-CREDITS.md).

## Prototype boundaries

Payments, delivery estimates, policies, fabric information and sizing are demonstrations. No real payments, shipments or refunds are created. Customer accounts, uploads, notifications, courier integrations, GST invoices, loyalty, unsupported reviews remain outside this upgrade. Replace editorial photographs with the client’s actual garment photography before launch. The striped shirt and black skirt share one outfit photograph; other fresh garments have distinct credited photographs.
