import { db, seed } from "../src/lib/db";
if (process.argv.includes("--reset")) {
  db.transaction(() => {
    db.exec(
      "DELETE FROM return_requests; DELETE FROM support_messages; DELETE FROM coupons; DELETE FROM orders; DELETE FROM product_meta; DELETE FROM variants; DELETE FROM products; DELETE FROM sessions;",
    );
  })();
  seed();
  console.log(
    "Demo reset: 24 products, 3 sample orders. Clear browser cart and wishlist from the footer.",
  );
} else {
  seed();
  console.log("Demo database ready. Existing changes preserved.");
}
db.close();
