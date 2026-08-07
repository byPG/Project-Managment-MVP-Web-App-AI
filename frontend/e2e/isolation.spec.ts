import { test, expect } from "@playwright/test";
import { createBoard, openBoard, signUpFreshUser } from "./helpers";

test.describe("Cross-user isolation", () => {
  test("a second user cannot see or open the first user's board", async ({ page }) => {
    await signUpFreshUser(page, "owner");
    await createBoard(page, "Owner's private board");
    await openBoard(page, "Owner's private board");

    const boardUrl = page.url();

    await page.getByTestId("sign-out-button").click();
    await expect(page).toHaveURL(/\/sign-in$/);

    await signUpFreshUser(page, "intruder");

    // The intruder's own board list must not include the other user's board.
    await expect(page.getByText("Owner's private board")).not.toBeVisible();

    // Directly visiting the other user's board URL must not leak data.
    await page.goto(boardUrl);
    await expect(page.getByText("Board not found.")).toBeVisible();
  });
});
