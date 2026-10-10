# Client presentation walkthrough

Use http://127.0.0.1:3001 with the fresh `data/kg-preview.sqlite` database. The preserved original database is separate.

1. Open the homepage. Present the K&G identity, five categories, featured edit, fresh arrivals and two demo offers. Show the phone layout too.
2. Search for “Scarlet” using the header. Open all results. Show filters, removable chips, sorting and collections.
3. Open Scarlet occasion dress. Show the full photograph, labelled detail crop, zoom and size guide. XS is sold out; select S or M. Save to wishlist, then add to the bag.
4. Open the full bag. Change quantity, show free-delivery progress and apply `KG10`. Remove/reapply it to demonstrate updated totals.
5. Enter a sample Indian address. Continue to payment, choose simulated online payment and enable the decline demonstration. Review and submit; the bag remains intact after failure. Edit payment, disable decline and submit successfully.
6. Save/copy the private order link. Open Your Orders and Track an Order. An order number alone does not reveal private details.
7. Open admin in another tab. Sign in with `admin@kgstore.demo` / `KGStoreDemo2026!`. Find the order and move it through Processing → Shipped → Delivered. Refresh the customer order to show dated tracking.
8. Request a return from the delivered order. In admin Returns, approve it, then confirm receipt. Explain that receipt restores stock once; the demo creates no refund.
9. Send a message from Contact. Open admin Support, find its reference and resolve it.
10. Show product editing: change stock, featured status and visibility. Removed colour variants remain in old order references. Disable/enable an offer in admin and show its storefront effect on refresh.

For an alternative cancellation demonstration, place a new COD order and cancel while Placed or Processing. Refresh to verify cancellation and restored stock. Shipped orders cannot be cancelled.

Before/after screenshots are local files under `artifacts`: `before-storefront-1440.png`, `kg-storefront-1440.png`, `kg-storefront-375.png`, and `kg-admin-1440.png`. Test screenshots include sample test activity. A clean preview screenshot is `kg-preview-1440.png`.

All customer actions persist locally. No real payment, email, shipment or refund occurs. Use sample details during the presentation.
