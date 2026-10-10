import { test, expect, type Page } from "@playwright/test";
import Database from "better-sqlite3";
import path from "node:path";
import type { Order } from "../../src/lib/types";
function database() {
  return new Database(path.resolve("data/e2e.sqlite"));
}
function stock() {
  const db = database();
  const row = db
    .prepare("SELECT stock FROM variants WHERE id='p1-S'")
    .get() as { stock: number };
  db.close();
  return row.stock;
}
async function addPiece(page: Page) {
  await page.goto("/product/scarlet-occasion-dress");
  await page.getByRole("button", { name: "S", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Shopping bag", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close bag", exact: true }).click();
}
async function address(page: Page) {
  await page.goto("/checkout");
  for (const [label, value] of Object.entries({
    "Full name": "Demo Test Shopper",
    "Email address": "demo-test@example.com",
    "Mobile number": "9876543210",
    "PIN code": "400001",
    "Street address": "12 Demo Test Avenue",
    City: "Mumbai",
    State: "Maharashtra",
  }))
    await page.getByLabel(label, { exact: true }).fill(value);
}
async function payment(page: Page) {
  await page
    .getByRole("button", { name: "Continue to payment", exact: true })
    .click();
}
async function review(page: Page) {
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Review your order", exact: true }),
  ).toBeVisible();
}
async function place(page: Page) {
  await review(page);
  await page
    .getByRole("button", { name: "Place demo order", exact: true })
    .click();
  await expect(page).toHaveURL(/\/order\/[a-f0-9]{48}$/);
  return page.url();
}
async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Password", { exact: true }).fill("KGStoreDemo2026!");
  await page
    .getByRole("button", { name: "Sign in to admin", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin$/);
}
async function fulfil(page: Page, orderUrl: string) {
  const db = database();
  const row = db
    .prepare("SELECT id FROM orders WHERE token=?")
    .get(orderUrl.split("/").pop()) as { id: string };
  db.close();
  await signIn(page);
  await page.goto(`/admin/orders/${row.id}`);
  for (const s of ["Processing", "Shipped", "Delivered"]) {
    await page
      .getByRole("combobox", { name: "Next status", exact: true })
      .selectOption(s);
    await page
      .getByRole("button", { name: "Update order", exact: true })
      .click();
    await expect(
      page.getByText(`Current status: ${s}`, { exact: true }),
    ).toBeVisible();
  }
}
test("search, dynamic filters, sorting, pagination, wishlist and bag persist", async ({
  page,
}) => {
  await page.goto("/shop");
  await expect(page.locator(".product-card")).toHaveCount(12);
  await page.getByRole("link", { name: "2", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator(".product-card")).toHaveCount(12);
  await page.getByLabel("Search clothing").fill("Scarlet");
  await page
    .locator("main")
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.goto(
    "/shop?category=Bottoms&size=S&colour=Blush&max=2000&sort=price-asc",
  );
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("link", { name: "Remove colour filter" }).click();
  await expect(page).toHaveURL(/category=Bottoms/);
  await expect(page).not.toHaveURL(/colour=/);
  await page.goBack();
  await expect(page).toHaveURL(/colour=Blush/);
  await page.goto("/product/scarlet-occasion-dress");
  await expect(
    page.getByRole("button", { name: "XS", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Add to bag", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Save to wishlist", exact: true })
    .click();
  await page.goto("/wishlist");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await addPiece(page);
  await page.goto("/cart");
  await page.reload();
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await page
    .locator("main")
    .getByRole("button", { name: /Increase quantity/ })
    .click();
  await expect(page.locator("main .quantity-control span")).toHaveText("2");
  await page
    .locator("main")
    .getByRole("button", { name: /Decrease quantity/ })
    .click();
  await expect(page.locator("main .quantity-control span")).toHaveText("1");
});
test("header search suggestions and collections use active products", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Search products", exact: true })
    .click();
  await page.getByLabel("Search store").fill("scarlet");
  await expect(page.locator(".search-result")).toHaveCount(1);
  await page.getByRole("link", { name: /View all results/ }).click();
  await expect(page).toHaveURL(/q=scarlet/);
  for (const c of ["new-arrivals", "featured", "sale"]) {
    await page.goto(`/collections/${c}`);
    await expect(page.locator(".product-card").first()).toBeVisible();
  }
});
test("quick add opens bag, respects size, and recently viewed persists", async ({
  page,
}) => {
  await page.goto("/shop?q=Scarlet");
  await page
    .getByRole("button", {
      name: "Quick add Scarlet occasion dress",
      exact: true,
    })
    .click();
  const quick = page.getByRole("dialog", {
    name: "Quick add Scarlet occasion dress",
    exact: true,
  });
  await expect(
    quick.getByRole("button", { name: "Add to bag", exact: true }),
  ).toBeDisabled();
  await quick.getByRole("button", { name: "M", exact: true }).click();
  await quick.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Shopping bag", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close bag" }).click();
  await page.goto("/product/scarlet-occasion-dress");
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Recently viewed", exact: true }),
  ).toBeVisible();
});
test("coupon checkout decline preserves stock; success reaches history and admin delivery", async ({
  page,
}) => {
  await addPiece(page);
  await page.goto("/cart");
  await page
    .getByRole("button", { name: "Have a coupon?", exact: true })
    .click();
  await page.getByLabel("Coupon code").fill("kg10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.locator("main").getByText("KG10 applied", { exact: false }),
  ).toBeVisible();
  await address(page);
  await page.getByLabel("Remember my details on this browser").check();
  await payment(page);
  await page.getByLabel("Simulated online payment").check();
  await page.getByLabel("Demonstrate a declined payment").check();
  const before = stock();
  await review(page);
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Demo payment declined",
  );
  expect(stock()).toBe(before);
  await page.getByRole("button", { name: "Edit", exact: true }).last().click();
  await page.getByLabel("Demonstrate a declined payment").uncheck();
  const url = await place(page);
  expect(stock()).toBe(before - 1);
  const db = database();
  const row = db
    .prepare("SELECT payload FROM orders WHERE token=?")
    .get(url.split("/").pop()) as { payload: string };
  const o = JSON.parse(row.payload) as Order;
  db.close();
  expect(o.discount).toBe(28990);
  expect(o.paymentStatus).toBe("Demo paid");
  await page.goto("/orders");
  await expect(page.getByText(o.id, { exact: true })).toBeVisible();
  await fulfil(page, url);
  await page.goto(url);
  await expect(page.locator(".order-progress .complete")).toHaveCount(4);
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", {
      name: "Your bag has room for something lovely.",
    }),
  ).toBeVisible();
  await addPiece(page);
  await page.goto("/checkout");
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    "Demo Test Shopper",
  );
  await page.getByRole("button", { name: "Remove remembered details" }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("kgstore-v2") || "{}").address,
    ),
  ).toBeNull();
});
test("invalid address and stock change block review and preserve bag", async ({
  page,
}) => {
  await addPiece(page);
  await address(page);
  await page.getByLabel("PIN code", { exact: true }).fill("123");
  await payment(page);
  await expect(
    page.getByRole("heading", { name: "Delivery details" }),
  ).toBeVisible();
  await page.getByLabel("PIN code", { exact: true }).fill("400001");
  await payment(page);
  const before = stock();
  const db = database();
  db.prepare("UPDATE variants SET stock=0 WHERE id='p1-S'").run();
  await page.getByRole("button", { name: "Review order" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "stock has changed",
  );
  db.prepare("UPDATE variants SET stock=? WHERE id='p1-S'").run(before);
  db.close();
  await page.goto("/cart");
  await expect(page.locator(".cart-item")).toHaveCount(1);
});
test("price changes and coupon disabling after review block submission", async ({
  page,
}) => {
  await addPiece(page);
  await address(page);
  await payment(page);
  await review(page);
  const db = database();
  db.prepare("UPDATE products SET price=price+100 WHERE id='p1'").run();
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "price has changed",
  );
  db.prepare("UPDATE products SET price=price-100 WHERE id='p1'").run();
  db.close();
  await page.goto("/cart");
  await page.getByRole("button", { name: "Have a coupon?" }).click();
  await page.getByLabel("Coupon code").fill("KG10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await address(page);
  await payment(page);
  await review(page);
  const next = database();
  next.prepare("UPDATE coupons SET active=0 WHERE code='KG10'").run();
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "coupon is unavailable",
  );
  next.prepare("UPDATE coupons SET active=1 WHERE code='KG10'").run();
  next.close();
});
test("private customer cancellation restores stock once and tracking requires access code", async ({
  page,
}) => {
  await addPiece(page);
  await address(page);
  await payment(page);
  const before = stock();
  const url = await place(page);
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Cancel order", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your demo order was cancelled." }),
  ).toBeVisible();
  expect(stock()).toBe(before);
  await page.reload();
  expect(stock()).toBe(before);
  await page.goto("/track-order");
  await page
    .getByLabel("Private order link or access code")
    .fill("AU-SAMPLE-1");
  await page.getByRole("button", { name: "View order" }).click();
  await expect(page.locator("main").getByRole("alert")).toBeVisible();
  await page.getByLabel("Private order link or access code").fill(url);
  await page.getByRole("button", { name: "View order" }).click();
  await expect(page).toHaveURL(url);
});
test("return request reaches admin and received restores stock once", async ({
  page,
}) => {
  await addPiece(page);
  await address(page);
  await payment(page);
  const before = stock();
  const url = await place(page);
  await fulfil(page, url);
  await page.goto(url);
  await page
    .getByLabel("Reason for return")
    .fill("The sample dress is not the right fit for me.");
  await page
    .getByRole("button", { name: "Request return", exact: true })
    .click();
  await expect(
    page.getByText("Status: Requested", { exact: true }),
  ).toBeVisible();
  await page.goto("/admin/returns?status=Requested");
  const card = page
    .locator(".history-grid .panel")
    .filter({ hasText: "The sample dress is not the right fit for me." });
  await card.getByRole("button", { name: "Update return" }).click();
  await expect(card).toHaveCount(0);
  expect(stock()).toBe(before - 1);
  await page.goto("/admin/returns?status=Approved");
  const approved = page
    .locator(".history-grid .panel")
    .filter({ hasText: "The sample dress is not the right fit for me." });
  await approved.getByRole("button", { name: "Update return" }).click();
  await page.goto(url);
  await expect(
    page.getByText("Status: Received", { exact: true }),
  ).toBeVisible();
  expect(stock()).toBe(before);
  await page.reload();
  expect(stock()).toBe(before);
});
test("contact message is saved and resolved in admin", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Full name", { exact: true }).fill("Support Test");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("support-test@example.com");
  await page
    .getByLabel("Subject", { exact: true })
    .fill("Sizing help for my next purchase");
  await page
    .getByLabel("Message", { exact: true })
    .fill("Please help me choose a size for the occasion dress.");
  await page.getByRole("button", { name: "Send demo message" }).click();
  await expect(page.locator("main").getByRole("status")).toContainText("MSG-");
  await signIn(page);
  await page.goto("/admin/support?q=support-test");
  await expect(
    page.getByRole("heading", { name: "Sizing help for my next purchase" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark resolved" }).click();
  await expect(page.getByText(/MSG-.*Resolved/)).toBeVisible();
});
test("all admin screens protected; cookie secure properties and expired session writes checked", async ({
  page,
  context,
}) => {
  for (const url of [
    "/admin",
    "/admin/products",
    "/admin/orders",
    "/admin/offers",
    "/admin/returns",
    "/admin/support",
  ]) {
    await page.goto(url);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
  await page.goto("/order/AU-SAMPLE-1");
  await expect(
    page.getByRole("heading", { name: "This page is no longer here." }),
  ).toBeVisible();
  await signIn(page);
  const cookie = (await context.cookies()).find(
    (c) => c.name === "kgstore-admin",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page.goto("/admin/products/p1");
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Unauthorised rename");
  const db = database();
  db.prepare("UPDATE sessions SET expires=0").run();
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(
    (
      db.prepare("SELECT name FROM products WHERE id='p1'").get() as {
        name: string;
      }
    ).name,
  ).toBe("Scarlet occasion dress");
  db.close();
  await signIn(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
test("admin manages multi-colour product, images, stock, featured and archive", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/admin/products/new");
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Test Blue City Coat");
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("Outerwear");
  await page.getByLabel("Selling price", { exact: false }).fill("3999");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A blue longline coat for this connected demo test.");
  await page
    .getByLabel("Fabric & care", { exact: true })
    .fill("Soft woven blend. Gentle cold wash.");
  await page.getByLabel("Colour", { exact: true }).fill("Blue");
  await page
    .getByRole("combobox", { name: "Image library 1", exact: true })
    .selectOption("/images/fashion-0.jpg");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await page.goto("/admin/products?q=Test+Blue+City+Coat");
  const inventoryDb = database();
  const originalVariants = inventoryDb
    .prepare(
      "SELECT v.id FROM variants v JOIN products p ON p.id=v.productId WHERE p.name='Test Blue City Coat'",
    )
    .all() as { id: string }[];
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page.getByLabel("Selling price", { exact: false }).fill("2999");
  await page.getByLabel("XS", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Add colour", exact: true }).click();
  const group = page.locator(".variant-editor").last();
  await group.getByLabel("Colour", { exact: true }).fill("Burgundy");
  await group
    .getByRole("combobox", { name: "Image library 1", exact: true })
    .selectOption("/images/catalogue/look-0.jpg");
  await page.getByLabel("Featured in the K&G edit").check();
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await page.goto("/shop?q=Test+Blue+City+Coat");
  await expect(page.locator(".product-price")).toContainText("₹2,999");
  await page.locator(".product-name").click();
  await expect(
    page.getByRole("button", { name: "XS", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Burgundy", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "XS", exact: true }),
  ).toBeEnabled();
  await page.goto("/admin/products?q=Test+Blue+City+Coat");
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Archived", exact: true }),
  ).toBeVisible();
  await page.goto("/shop?q=Test+Blue+City+Coat");
  await expect(page.locator(".product-card")).toHaveCount(0);
  await page.goto("/admin/products?q=Test+Blue+City+Coat");
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "Active", exact: true }),
  ).toBeVisible();
  const variantsAfterEdit = inventoryDb
    .prepare(
      "SELECT v.id,v.active,v.colour FROM variants v JOIN products p ON p.id=v.productId WHERE p.name='Test Blue City Coat'",
    )
    .all() as { id: string; active: number; colour: string }[];
  expect(
    originalVariants.every((v) =>
      variantsAfterEdit.some((next) => next.id === v.id && next.active === 1),
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove colour 2", exact: true })
    .click();
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  const inactive = inventoryDb
    .prepare(
      "SELECT v.id,v.active FROM variants v JOIN products p ON p.id=v.productId WHERE p.name='Test Blue City Coat' AND v.colour='Burgundy'",
    )
    .all() as { id: string; active: number }[];
  expect(inactive).toHaveLength(5);
  expect(inactive.every((v) => v.active === 0)).toBe(true);
  expect(inactive.map((v) => v.id).sort()).toEqual(
    variantsAfterEdit
      .filter((v) => v.colour === "Burgundy")
      .map((v) => v.id)
      .sort(),
  );
  inventoryDb.close();
});
test("legacy cart and wishlist migrate without loss", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "aurelle-v1",
      JSON.stringify({
        cart: [
          { productId: "p2", variantId: "p2-M", quantity: 1, price: 149900 },
        ],
        wishlist: ["p1"],
      }),
    ),
  );
  await page.reload();
  await page.goto("/cart");
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await page
    .locator("main")
    .getByRole("button", { name: /Increase quantity/ })
    .click();
  const data = await page.evaluate(() => ({
    legacy: localStorage.getItem("aurelle-v1"),
    current: JSON.parse(localStorage.getItem("kgstore-v2") || "{}"),
  }));
  expect(data.legacy).toBeNull();
  expect(data.current.cart[0].quantity).toBe(2);
  expect(data.current.wishlist).toEqual(["p1"]);
});
test("offers can be disabled by admin and removed from the bag", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/admin/offers");
  await page.getByRole("button", { name: "Disable KG10", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enable KG10", exact: true }),
  ).toBeVisible();
  await addPiece(page);
  await page.goto("/cart");
  await page
    .getByRole("button", { name: "Have a coupon?", exact: true })
    .click();
  await page.getByLabel("Coupon code").fill("KG10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "coupon is unavailable",
  );
  await page.goto("/admin/offers");
  await page.getByRole("button", { name: "Enable KG10", exact: true }).click();
  await page.goto("/cart");
  await page
    .getByRole("button", { name: "Have a coupon?", exact: true })
    .click();
  await page.getByLabel("Coupon code").fill("KG10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove coupon", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("kgstore-v2") || "{}").coupon,
    ),
  ).toBe("");
});
test("blocked browser storage never reports a successful addition", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Storage disabled", "QuotaExceededError");
    };
  });
  await page.goto("/product/scarlet-occasion-dress");
  await page.getByRole("button", { name: "S", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(page.locator(".purchase .error")).toContainText(
    "could not save",
  );
  await expect(
    page.getByRole("dialog", { name: "Shopping bag", exact: true }),
  ).not.toBeVisible();
});
test("native size guide and zoom support Escape and focus return", async ({
  page,
}) => {
  await page.goto("/product/scarlet-occasion-dress");
  const guide = page
    .locator("main")
    .getByRole("button", { name: "Size guide", exact: true });
  await guide.click();
  await expect(
    page.getByRole("dialog", { name: "Size guide", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide).toBeFocused();
  await page.getByRole("button", { name: "Zoom product image" }).click();
  await expect(
    page.getByRole("dialog", { name: "Product image zoom" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Zoom product image" }),
  ).toBeFocused();
});
for (const width of [375, 768, 1440])
  test(`store and admin layouts, images and keyboard work at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const url of [
      "/",
      "/shop",
      "/product/scarlet-occasion-dress",
      "/cart",
      "/orders",
      "/track-order",
      "/contact",
      "/returns",
      "/faq",
      "/privacy",
      "/terms",
    ]) {
      await page.goto(url);
      await expect(page.locator("main")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        url,
      ).toBe(true);
      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.locator("img").evaluateAll((images) =>
        images.forEach((img) => {
          if (img instanceof HTMLImageElement) img.loading = "eager";
        }),
      );
      await expect
        .poll(
          () =>
            page
              .locator("img")
              .evaluateAll(
                (images) =>
                  images.filter(
                    (img) =>
                      img instanceof HTMLImageElement &&
                      !img.closest("dialog:not([open])") &&
                      img.naturalWidth === 0,
                  ).length,
              ),
          { message: url },
        )
        .toBe(0);
    }
    await page.goto("/");
    await page.screenshot({
      path: `artifacts/kg-storefront-${width}.png`,
      fullPage: true,
    });
    await signIn(page);
    for (const url of [
      "/admin",
      "/admin/products",
      "/admin/offers",
      "/admin/returns",
      "/admin/support",
    ]) {
      await page.goto(url);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        url,
      ).toBe(true);
    }
    await page.goto("/admin");
    await page.screenshot({
      path: `artifacts/kg-admin-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
