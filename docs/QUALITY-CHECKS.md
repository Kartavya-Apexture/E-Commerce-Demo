# Quality checks — 9 October 2026

All required checks completed on Windows with Node.js 22.13.0, Next.js 16.4.0, and better-sqlite3 12.11.1.

| Check | Result |
|---|---|
| `npm run lint` | Passed, zero warnings/errors |
| `npm run typecheck` | Passed, strict TypeScript |
| `npm run build` | Passed, all storefront/admin routes built |
| `npm run test:commerce` | 15 passed |
| `npm run test:e2e` | 11 passed against the production build |
| `npm audit --omit=dev` | Zero runtime dependency advisories |

## Complete order story

| Boundary | Evidence |
|---|---|
| Storefront | Product selection, filters, wishlist, cart quantity changes, and persistence passed browser tests. |
| Browser → checkout | Guest form submissions and declined/successful payment simulation passed. |
| Checkout → SQLite | Inventory decreases once, orders are saved, duplicate requests reuse the original order, invalid orders reserve nothing. |
| SQLite → admin | The shopper’s new order appears in admin with item/customer/payment details. |
| Admin → customer | Processing, Shipped, and Delivered updates appear on the private customer order page. |
| Cancellation | Pre-shipment cancellation restores stock once and appears on the customer page. |
| Access control | Logged-out admin pages redirect. Expired sessions cannot save product changes. Cookies are HttpOnly and SameSite=Lax. Guessing an order ID does not expose its private page. |

## Data and error scenarios

Commerce tests verify sample seeding, delivery threshold, invalid PIN/phone, changed prices, insufficient stock, duplicate variants, multi-item failure, archived product rejection, status transitions, cancellation idempotence, unpredictable order tokens, persistence in a new process, and the reset command.

Browser tests verify invalid-address browser validation, stock changing after the checkout page was rendered, failed payment preserving the cart, product creation/editing, size stock changes, and archive/restore behaviour.

## Visual and accessibility checks

Storefront, shop, product, bag, and information layouts were checked at **375px, 768px, and 1440px**. No page overflow, broken completed images, or uncaught browser errors were found. Storefront and admin screenshots were visually inspected. The size guide’s keyboard focus, Escape dismissal, and focus return passed. Menu, filters, and size guide use native labelled dialogs; controls use visible focus styles.

Automated layout coverage uses Chromium. This is not a complete multi-browser or screen-reader accessibility audit.

## Isolated test data

Commerce tests use unique databases under `data/commerce-tests-*`. Browser tests reset `data/e2e.sqlite`, then run a separate production server on port 3100. The client presentation uses `data/aurelle.sqlite` on port 3000 and is not reset by these tests.

## Compatibility notes

better-sqlite3 13.0.3 caused a native process crash on this installed Windows/Node runtime. Pinning 12.11.1 resolved it; seeding, builds, transactions, and all tests passed afterward.

The full dependency audit reports five transitive advisories in the development-only Next.js ESLint chain. Runtime audit is clean. No breaking framework downgrade was applied.

Local credentials, sample product imagery, and simulated payments are intentional prototype defaults. Production authentication, payments, delivery, and hosting remain a separate stage.
