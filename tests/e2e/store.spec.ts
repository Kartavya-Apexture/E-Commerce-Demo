import { test, expect, type Page } from "@playwright/test";
import Database from "better-sqlite3";
import path from "node:path";
import type { Order } from "../../src/lib/types";

async function addPiece(page: Page) {
  await page.goto("/product/scarlet-occasion-dress");
  await page.getByRole("button", { name: "S", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByText("Added to your bag.")).toBeVisible();
}
async function fillCheckout(page: Page) {
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
async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Password", { exact: true }).fill("AurelleDemo2026!");
  await page.getByRole("button", { name: "Sign in to admin" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
function readStock() {
  const db = new Database(path.resolve("data/e2e.sqlite"));
  const row = db
    .prepare("SELECT stock FROM variants WHERE id=?")
    .get("p1-S") as { stock: number };
  db.close();
  return row.stock;
}

test("storefront search, filters, sorting, wishlist, and cart persist", async ({
  page,
}) => {
  await page.goto("/shop");
  await expect(page.locator(".product-card")).toHaveCount(24);
  await page.getByLabel("Search clothing").fill("Scarlet");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(5);
  await expect(page).toHaveURL(/q=Scarlet/);
  await page.goto(
    "/shop?category=Bottoms&size=S&colour=Blush&max=2000&sort=price-asc",
  );
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page.goto("/product/scarlet-occasion-dress");
  await expect(
    page.getByRole("button", { name: "XS", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Add to bag" })).toBeDisabled();
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
  await page.getByRole("button", { name: /Increase quantity/ }).click();
  await expect(page.locator(".quantity-control span")).toHaveText("2");
  await page.getByRole("button", { name: /Decrease quantity/ }).click();
  await expect(page.locator(".quantity-control span")).toHaveText("1");
});
test("declined online payment preserves cart and inventory; successful order reaches admin and customer status", async ({
  page,
}) => {
  await addPiece(page);
  await fillCheckout(page);
  const before = readStock();
  await page.getByLabel("Simulated online payment").check();
  await page.getByLabel("Demonstrate a declined payment").check();
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Demo payment declined",
  );
  expect(readStock()).toBe(before);
  await page.getByLabel("Demonstrate a declined payment").uncheck();
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(page).toHaveURL(/\/order\/[a-f0-9]{48}$/);
  const orderUrl = page.url();
  await expect(
    page.getByRole("heading", { name: "Lovely choices. All yours." }),
  ).toBeVisible();
  expect(readStock()).toBe(before - 1);
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", {
      name: "Your bag has room for something lovely.",
    }),
  ).toBeVisible();
  await signIn(page);
  await page.goto("/admin/orders?q=demo-test");
  await page.locator("tbody a").first().click();
  await expect(
    page.getByText("demo-test@example.com", { exact: false }),
  ).toBeVisible();
  for (const status of ["Processing", "Shipped", "Delivered"]) {
    await page
      .getByRole("combobox", { name: "Next status", exact: true })
      .selectOption(status);
    await page
      .getByRole("button", { name: "Update order", exact: true })
      .click();
    await expect(
      page.getByText(`Current status: ${status}`, { exact: true }),
    ).toBeVisible();
  }
  await page.goto(orderUrl);
  await expect(page.locator(".order-progress .complete")).toHaveCount(4);
  const db = new Database(path.resolve("data/e2e.sqlite"));
  const row = db
    .prepare("SELECT payload FROM orders WHERE token=?")
    .get(orderUrl.split("/").pop()) as { payload: string };
  const order = JSON.parse(row.payload) as Order;
  db.close();
  expect(order.status).toBe("Delivered");
  expect(order.paymentStatus).toBe("Demo paid");
});
test("admin is protected and private order URLs are not guessable", async ({
  page,
  context,
}) => {
  for (const route of [
    "/admin",
    "/admin/products",
    "/admin/orders",
    "/admin/orders/AU-SAMPLE-1",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
  await page.goto("/order/AU-SAMPLE-1");
  await expect(
    page.getByRole("heading", { name: "This page is no longer here." }),
  ).toBeVisible();
  await signIn(page);
  const cookies = await context.cookies();
  const cookie = cookies.find((c) => c.name === "aurelle-admin");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
test("admin creates, edits, archives, and restores a product in the storefront", async ({
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
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await page.goto("/shop?q=Test+Blue+City+Coat");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.goto("/admin/products?q=Test+Blue+City+Coat");
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page.getByLabel("Selling price", { exact: false }).fill("2999");
  await page.getByLabel("XS", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await page.goto("/shop?q=Test+Blue+City+Coat");
  await expect(page.locator(".product-price")).toContainText("₹2,999");
  await page.locator(".product-name").click();
  await expect(
    page.getByRole("button", { name: "XS", exact: true }),
  ).toBeDisabled();
  await page.goto("/admin/products?q=Test+Blue+City+Coat");
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page.getByText("Archived", { exact: true })).toBeVisible();
  await page.goto("/shop?q=Test+Blue+City+Coat");
  await expect(page.locator(".product-card")).toHaveCount(0);
  await page.goto("/admin/products?q=Test+Blue+City+Coat");
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(page.getByText("Active", { exact: true })).toBeVisible();
  await page.goto("/shop?q=Test+Blue+City+Coat");
  await expect(page.locator(".product-card")).toHaveCount(1);
});
test("size guide supports keyboard focus and dismissal", async ({ page }) => {
  await page.goto("/product/scarlet-occasion-dress");
  await page.getByRole("button", { name: "Size guide" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close size guide" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Size guide" })).toBeFocused();
});
test("cancelling a demo order restores stock and updates the customer page", async ({
  page,
}) => {
  await addPiece(page);
  await fillCheckout(page);
  const before = readStock();
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(page).toHaveURL(/\/order\/[a-f0-9]{48}$/);
  const orderUrl = page.url();
  expect(readStock()).toBe(before - 1);
  await signIn(page);
  await page.goto("/admin/orders?q=demo-test");
  await page.locator("tbody a").first().click();
  await page
    .getByRole("combobox", { name: "Next status", exact: true })
    .selectOption("Cancelled");
  await page.getByRole("button", { name: "Update order", exact: true }).click();
  await expect(
    page.getByText("Current status: Cancelled", { exact: true }),
  ).toBeVisible();
  expect(readStock()).toBe(before);
  await page.goto(orderUrl);
  await expect(
    page.getByRole("heading", { name: "Your demo order was cancelled." }),
  ).toBeVisible();
});
test("invalid address and stock changes prevent checkout without losing the bag", async ({
  page,
}) => {
  await addPiece(page);
  await fillCheckout(page);
  await page.getByLabel("PIN code", { exact: true }).fill("123");
  await page.getByRole("button", { name: "Place demo order" }).click();
  expect(
    await page
      .getByLabel("PIN code", { exact: true })
      .evaluate(
        (input) =>
          input instanceof HTMLInputElement && input.validity.patternMismatch,
      ),
  ).toBe(true);
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByLabel("PIN code", { exact: true }).fill("400001");
  const db = new Database(path.resolve("data/e2e.sqlite"));
  const before = readStock();
  db.prepare("UPDATE variants SET stock=0 WHERE id=?").run("p1-S");
  await page.getByRole("button", { name: "Place demo order" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "only 0 available",
  );
  db.prepare("UPDATE variants SET stock=? WHERE id=?").run(before, "p1-S");
  db.close();
  await page.goto("/cart");
  await expect(page.locator(".cart-item")).toHaveCount(1);
});
test("an expired admin session cannot save product changes", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/admin/products/p1");
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Unauthorised rename");
  const db = new Database(path.resolve("data/e2e.sqlite"));
  db.prepare("UPDATE sessions SET expires=0").run();
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  const product = db
    .prepare("SELECT name FROM products WHERE id=?")
    .get("p1") as { name: string };
  expect(product.name).toBe("Scarlet occasion dress");
  db.close();
});
for (const width of [375, 768, 1440])
  test(`layouts and local images work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of [
      "/",
      "/shop",
      "/product/scarlet-occasion-dress",
      "/cart",
      "/about",
    ]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const broken = await page
        .locator("img")
        .evaluateAll(
          (images) =>
            images.filter(
              (img) =>
                img instanceof HTMLImageElement &&
                img.complete &&
                img.naturalWidth === 0,
            ).length,
        );
      expect(broken).toBe(0);
    }
    await page.goto("/");
    await page.screenshot({
      path: `artifacts/storefront-${width}.png`,
      fullPage: true,
    });
    await signIn(page);
    await page.screenshot({
      path: `artifacts/admin-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
