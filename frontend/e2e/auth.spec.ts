import { test, expect } from "@playwright/test";
import { signUpFreshUser } from "./helpers";

test.describe("Authentication", () => {
  test("signs up, lands on boards, and signs out", async ({ page }) => {
    await signUpFreshUser(page);

    await expect(page.getByTestId("sign-out-button")).toBeVisible();

    await page.getByTestId("sign-out-button").click();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("session persists across a page refresh", async ({ page }) => {
    await signUpFreshUser(page);

    await page.reload();

    await expect(page).toHaveURL(/\/boards$/);
    await expect(page.getByTestId("sign-out-button")).toBeVisible();
  });

  test("can sign back in after signing out", async ({ page }) => {
    const { email, password } = await signUpFreshUser(page);

    await page.getByTestId("sign-out-button").click();
    await expect(page).toHaveURL(/\/sign-in$/);

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/boards$/);
  });

  test("shows an error for an invalid password", async ({ page }) => {
    const { email } = await signUpFreshUser(page);
    await page.getByTestId("sign-out-button").click();

    await expect(page).toHaveURL(/\/sign-in$/);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("rejects sign-up with a duplicate email", async ({ page }) => {
    const { email, password } = await signUpFreshUser(page);
    await page.getByTestId("sign-out-button").click();

    await page.goto("/sign-up");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
  });
});
