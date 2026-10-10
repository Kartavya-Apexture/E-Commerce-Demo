import { test, expect, type Page } from "@playwright/test";
async function place(page: Page, blockSave = false) {
  await page.goto("/product/scarlet-occasion-dress");
  await page.getByRole("button", { name: "S", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page.getByRole("button", { name: "Close bag", exact: true }).click();
  await page.goto("/checkout");
  for (const [label, value] of Object.entries({
    "Full name": "Browser Demo Shopper",
    "Email address": "demo@example.com",
    "Mobile number": "9876543210",
    "PIN code": "400001",
    "Street address": "12 Sample Lane",
    City: "Mumbai",
    State: "Maharashtra",
  }))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByRole("button", { name: "Continue to payment", exact: true })
    .click();
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Review your order", exact: true }),
  ).toBeVisible();
  if (blockSave)
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === "kg-browser-demo-v1")
          throw new DOMException("Demo quota exceeded", "QuotaExceededError");
        return original.call(this, key, value);
      };
    });
  await page
    .getByRole("button", { name: "Place demo order", exact: true })
    .click();
  if (blockSave) {
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "Could not save the demo",
    );
    return page.url();
  }
  await expect(page).toHaveURL(/\/order\/[a-f0-9]{48}$/);
  await expect(
    page.getByRole("heading", { name: "Lovely choices. All yours." }),
  ).toBeVisible();
  return page.url();
}
test("failed browser persistence keeps bag, stock and order list unchanged", async ({
  page,
}) => {
  await place(page, true);
  await expect(page).toHaveURL(/\/checkout$/);
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Scarlet occasion dress", exact: true }),
  ).toBeVisible();
  await page.goto("/orders");
  await expect(
    page.getByRole("heading", { name: "No saved orders yet" }),
  ).toBeVisible();
});
async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Password", { exact: true }).fill("KGStoreDemo2026!");
  await page
    .getByRole("button", { name: "Sign in to admin", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
}
test("browser checkout survives refresh and reaches admin delivery and return receipt", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const link = await place(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Lovely choices. All yours." }),
  ).toBeVisible();
  await page.goto("/orders");
  await expect(
    page.getByRole("link", { name: /View & track order/ }),
  ).toBeVisible();
  await login(page);
  await page.goto("/admin/orders");
  await page.getByRole("link", { name: /KG-/ }).click();
  for (const status of ["Processing", "Shipped", "Delivered"]) {
    await page
      .getByRole("button", { name: "Update order", exact: true })
      .click();
    await expect(
      page.getByText(`Current status: ${status}`, { exact: true }),
    ).toBeVisible();
  }
  await page.goto(link);
  await expect(
    page.getByRole("heading", { name: "Request a return", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Reason for return").fill("The fit does not suit me.");
  await page
    .getByRole("button", { name: "Request return", exact: true })
    .click();
  await expect(
    page.getByText("Status: Requested", { exact: true }),
  ).toBeVisible();
  await page.goto("/admin/returns");
  await page
    .getByRole("button", { name: "Update return", exact: true })
    .click();
  await expect(
    page.getByRole("option", { name: "Received (restore stock)" }),
  ).toBeAttached();
  await page
    .getByRole("button", { name: "Update return", exact: true })
    .click();
  await expect(page.getByText("Return complete: Received")).toBeVisible();
  await page.goto(link);
  await expect(
    page.getByText("Status: Received", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("browser product edits and support use same persistent store", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/products/p1");
  await page
    .getByLabel("Product name", { exact: true })
    .fill("Scarlet edited demo dress");
  await page.getByRole("button", { name: /Save product/ }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await page.goto("/product/scarlet-occasion-dress");
  await expect(
    page.getByRole("heading", {
      name: "Scarlet edited demo dress",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/contact");
  for (const [label, value] of Object.entries({
    "Full name": "Demo Shopper",
    "Email address": "demo@example.com",
    Subject: "Browser support",
    Message: "Please explain the size guide.",
  }))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Send demo message" }).click();
  await expect(page.getByRole("status")).toContainText("MSG-");
  await page.goto("/admin/support");
  await expect(
    page.getByRole("heading", { name: "Browser support" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark resolved" }).click();
  await expect(page.getByText("Resolved", { exact: true })).toBeVisible();
});
test("fresh browsers are isolated and admin screens require demo login", async ({
  page,
  browser,
}) => {
  const link = await place(page);
  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto(link);
  await expect(
    other.getByRole("heading", { name: "This page is no longer here." }),
  ).toBeVisible();
  await other.goto("/admin/orders");
  await expect(
    other.getByRole("heading", { name: "Welcome to your store." }),
  ).toBeVisible();
  await context.close();
});
for (const width of [375, 768, 1440])
  test(`browser layouts and images at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const route of [
      "/",
      "/shop",
      "/collections/sale",
      "/product/scarlet-occasion-dress",
      "/contact",
    ]) {
      await page.goto(route);
      await expect(page.locator("footer")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        route,
      ).toBe(true);
      await expect
        .poll(() =>
          page
            .locator("img")
            .evaluateAll(
              (images) =>
                images.filter(
                  (i) =>
                    i instanceof HTMLImageElement &&
                    i.loading !== "lazy" &&
                    i.naturalWidth === 0,
                ).length,
            ),
        )
        .toBe(0);
    }
    await login(page);
    await page.goto("/admin/products");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    if (width === 1440) {
      await page.goto("/");
      await page.screenshot({
        path: "artifacts/kg-browser-demo.png",
        fullPage: false,
      });
    }
  });
