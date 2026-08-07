import { expect, type Page } from "@playwright/test";

// Every spec signs up a brand-new user rather than relying on seeded/shared
// data, so tests don't depend on run order or on state left behind by a
// previous run against the same backend database.
export function uniqueEmail(prefix: string): string {
  return `e2e-${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

export async function signUpFreshUser(
  page: Page,
  prefix = "user",
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail(prefix);
  const password = "password123";

  await page.goto("/sign-up");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(/\/boards$/);

  return { email, password };
}

export async function createBoard(page: Page, name: string): Promise<void> {
  await page.getByTestId("board-name-input").fill(name);
  await page.getByTestId("create-board-button").click();
  await expect(page.getByText(name)).toBeVisible();
}

export async function openBoard(page: Page, name: string): Promise<void> {
  await page.getByRole("link", { name }).click();
  await expect(page.getByTestId("kanban-board")).toBeVisible();
}
