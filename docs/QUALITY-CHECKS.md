# Quality checks — K&G upgrade, 10 October 2026

The baseline passed lint, typecheck, build, 15 commerce tests and 11 browser tests before changes. The upgraded implementation passes the checks below on Windows, Node.js 22.13.0, Next.js 16.4.0 and better-sqlite3 12.11.1.

| Required check          | Upgrade result                                          |
| ----------------------- | ------------------------------------------------------- |
| `npm run lint`          | Passed, zero warnings or errors                         |
| `npm run typecheck`     | Passed, strict TypeScript, no explicit any              |
| `npm run build`         | Passed, all storefront and admin routes built           |
| `npm run test:commerce` | 24 passed                                               |
| `npm run test:e2e`      | 18 passed against production Chromium and isolated data |

## Business rules and connected flows

Commerce tests cover delivery thresholds, coupon minimums/caps/case handling/paise rounding, current server quotes, forged review totals, disabled coupons, invalid addresses, failed payments, changed prices, insufficient stock, inactive/archived variants, duplicate requests and atomic multi-item failure. Cancellation and return receipt restore stock once; approval does not. Returns enforce delivery, the seven-day limit, reasons, duplicate prevention, rejection and valid transitions.

Browser tests complete shopping → coupon → address/payment/review → order → private history → admin fulfilment → customer delivery tracking → return request → admin receipt. Separate cases verify declined-payment recovery, cancellation, tracking privacy, support submissions/resolution and offer toggling/removal. Product tests create/edit multi-colour inventory, preserve variant identifiers, deactivate removed colours, change stock/featured/images and archive/restore products.

All protected admin screens redirect logged-out visitors. Expired sessions cannot write product changes. Admin cookies are HttpOnly and SameSite=Lax. Every new protected action checks authorization in code. Invalid private access codes/order numbers reveal no order details. Browser storage failure produces an error and never a successful addition.

## Safe upgrade and persistence

Before migration, the original database was backed up to `data/backups/pre-kg-upgrade.sqlite`. Additive migrations preserve existing catalogue edits, IDs/slugs, stock, orders and private tokens; old admin sessions are invalidated once. A legacy-schema fixture is migrated and reopened in two separate processes, verifying its edited product, variant ID/stock, private order and safe discount/history defaults. Another process verifies saved edits survive restart and seed does not overwrite them. Reset is tested against isolated data.

Valid legacy cart and wishlist data migrate without loss. New browser storage holds private tokens only for order history, with customer details remembered only by an unchecked opt-in.

## Visual and accessibility checks

Storefront, shop, product, bag, private history, tracking, contact and policy pages are checked at 375px, 768px and 1440px. Admin overview/products/offers/returns/support are checked at the same widths. Completed visible photographs load, pages do not overflow, and no uncaught browser errors occur. Native size guide and zoom pass Escape and focus-return checks. Visible focus styling and reduced-motion rules are included.

Storefront and admin screenshots were inspected visually. A mobile dashboard grid overflow found during testing was fixed by allowing the table container to shrink while keeping horizontal scrolling inside the table. Generated browser reports are excluded from lint and Git.

This is Chromium coverage, not a complete multi-browser or screen-reader audit.

## Isolation and handoff

- Presentation: `data/kg-preview.sqlite`, port 3001, fresh 24-garment catalogue.
- Preserved original: `data/aurelle.sqlite`; never automatically reset.
- Browser tests: `data/e2e.sqlite`, port 3100.
- Commerce and migration tests: separate temporary databases under ignored `data`.
- Screenshots and browser reports: ignored `artifacts`, `test-results` and `playwright-report`.
- Synced reference files and other F: projects: untouched.

Runtime dependencies remain unchanged. Real payments, delivery, email and refunds remain outside this local prototype. Local photo/font sources and licences are documented in IMAGE-CREDITS.md.

## Vercel temporary demo fix

The runtime failure was ENOENT creating /var/task/data. Database selection now uses Node’s temporary directory on Vercel, including when an old relative DEMO_DB_PATH is configured. Local paths remain unchanged. Added tests verify deployment-path isolation/traversal handling and actual temporary-database seeding, checkout and duplicate protection across warm processes. Temporary files are neither persistent nor shared across Vercel instances; the online UI and README state this limit.

Fix validation: lint, strict typecheck and production build passed; 26 commerce tests and 18 production browser tests passed. With VERCEL=1 and a deliberately unwritable local database override, homepage, shop, product, checkout and admin login returned HTTP 200 with the temporary-storage notice. The final build has no filesystem tracing warning.
