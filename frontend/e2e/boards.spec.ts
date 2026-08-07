import { test, expect } from "@playwright/test";
import { createBoard, openBoard, signUpFreshUser } from "./helpers";

test.describe("Boards", () => {
  test("creates a board, opens it, then deletes it", async ({ page }) => {
    await signUpFreshUser(page);

    // Every new user starts with one default board from signup.
    await expect(page.getByText("My First Board")).toBeVisible();

    await createBoard(page, "Personal errands");
    await openBoard(page, "Personal errands");
    await expect(page.getByRole("heading", { name: "Personal errands" })).toBeVisible();

    await page.getByRole("link", { name: /your boards/i }).click();
    await expect(page).toHaveURL(/\/boards$/);
    await expect(page.getByText("Personal errands")).toBeVisible();

    await page.getByRole("button", { name: "Delete board Personal errands" }).click();
    await expect(page.getByText("Personal errands")).not.toBeVisible();
  });

  test("visiting an unknown board id shows not found", async ({ page }) => {
    await signUpFreshUser(page);

    await page.goto("/boards/999999999");
    await expect(page.getByText("Board not found.")).toBeVisible();
    await expect(page.getByRole("link", { name: /back to your boards/i })).toBeVisible();
  });
});
