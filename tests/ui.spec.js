const { test, expect } = require("@playwright/test");

const numberInput = (page, selector, value) => page.fill(selector, String(value));

test("loads core UI elements", async ({ page, baseURL }) => {
  await page.goto(baseURL);

  await expect(page.getByRole("heading", { name: "CoastFIRE by Age and Spend" })).toBeVisible();
  await expect(page.locator("#coastChart")).toBeVisible();
  await expect(page.locator("#coastGrowthChart")).toBeVisible();
  await expect(page.locator("#gridTable")).toBeVisible();
});

test("updates stats when inputs change", async ({ page, baseURL }) => {
  await page.goto(baseURL);

  await numberInput(page, "#currentAssets", 600000);
  await numberInput(page, "#spendInput", 80000);

  const statAssets = page.locator("#statAssets");
  const statSpend = page.locator("#statSpend");

  await expect(statAssets).toContainText("$600,000");
  await expect(statSpend).toContainText("$80,000");

  const coastText = await page.locator("#statCoast").innerText();
  expect(coastText.length).toBeGreaterThan(0);
});

test("renders grid rows and columns", async ({ page, baseURL }) => {
  await page.goto(baseURL);

  await expect(page.locator("#gridTable thead")).toBeVisible();

  const headerCells = page.locator("#gridTable thead th");
  await expect(headerCells).toHaveCount(1 + 251);

  const bodyRows = page.locator("#gridTable tbody tr");
  await expect(bodyRows).toHaveCount(70);
});
