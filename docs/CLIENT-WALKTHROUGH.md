# A five-minute client presentation

1. Open http://127.0.0.1:3000. Show the Aurelle campaign, collection categories, new arrivals, and mobile layout.
2. Open the collection. Search for “Scarlet”, apply a size or price filter, and show how sorting works. Clear filters to return to all 24 sample pieces.
3. Open the Scarlet occasion dress. Show the gallery/detail crop and size guide. XS is sold out; choose S or M. Save the piece to the wishlist, then add it to the bag.
4. Open the bag. Change quantity, show delivery pricing, and continue as a guest. Enter sample Indian contact/address details.
5. Choose simulated online payment and enable “Demonstrate a declined payment”. Place the order to show the failure message and unchanged bag. Disable the failure checkbox and place it again successfully.
6. Save the private order page URL. No actual money or parcel is involved.
7. Open http://127.0.0.1:3000/admin in another tab. Sign in with admin@aurelle.demo / AurelleDemo2026!.
8. Find the new order. Move it through Processing, Shipped, and Delivered. Refresh the customer’s saved order page to show the same statuses.
9. Edit a product’s selling price and stock. Refresh the storefront to show the changes. Archive a product and show that it disappears; restore it afterward.
10. Explain that branding, actual catalogue photos, policies, payments, courier services, and production hosting are the next stage after design approval.

To show cancellation instead, cancel a new Placed or Processing order and compare variant stock before and after. Cancellation is unavailable after shipping. Payment status is shown separately.

Before repeating the presentation, close browser tabs, run `npm run demo:reset`, then use “Clear my demo data” in the storefront footer. The reset restores only this demo’s local database; the footer clears only this browser’s cart and wishlist.
