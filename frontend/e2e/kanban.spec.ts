import { test, expect } from "@playwright/test";

test.describe("Kanban Board MVP", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(/email/i).fill("demo@kanban.app");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("heading", { name: /kanban board/i })).toBeVisible();
  });

  test("should render five columns with initial dummy cards", async ({ page }) => {
    const board = page.getByTestId("kanban-board");
    await expect(board).toBeVisible();

    for (const columnId of [1, 2, 3, 4, 5]) {
      await expect(page.getByTestId(`column-${columnId}`)).toBeVisible();
    }

    await expect(page.getByTestId("column-title-1")).toContainText("Backlog");
    await expect(page.getByTestId("column-title-2")).toContainText("To Do");
    await expect(page.getByTestId("column-title-3")).toContainText("In Progress");
    await expect(page.getByTestId("column-title-4")).toContainText("Review");
    await expect(page.getByTestId("column-title-5")).toContainText("Done");

    // Dummy card initial check
    await expect(page.getByTestId("card-1")).toBeVisible();
    await expect(page.getByText("Research competitors")).toBeVisible();
  });

  test("should allow renaming a column", async ({ page }) => {
    const titleBtn = page.getByTestId("column-title-1");
    await titleBtn.click();

    const titleInput = page.getByTestId("column-title-input-1");
    await expect(titleInput).toBeVisible();

    await titleInput.fill("Ideas & Backlog");
    await titleInput.press("Enter");

    await expect(page.getByTestId("column-title-1")).toContainText("Ideas & Backlog");
  });

  test("should allow adding a new card to a selected column", async ({ page }) => {
    const addCardBtn = page.getByTestId("add-card-button-1");
    await addCardBtn.click();

    const modal = page.getByTestId("add-card-modal");
    await expect(modal).toBeVisible();

    await page.getByTestId("card-title-input").fill("Automated Test Task");
    await page.getByTestId("card-details-input").fill("Details for automated test card");
    await page.getByTestId("submit-card-button").click();

    await expect(modal).not.toBeVisible();
    await expect(page.getByText("Automated Test Task")).toBeVisible();
    await expect(page.getByText("Details for automated test card")).toBeVisible();
  });

  test("should allow deleting an existing card", async ({ page }) => {
    // Create a disposable card rather than deleting seed data, since later
    // tests in this suite depend on the seeded cards still being present.
    await page.getByTestId("add-card-button-1").click();
    const modal = page.getByTestId("add-card-modal");
    await expect(modal).toBeVisible();
    await page.getByTestId("card-title-input").fill("Card To Delete");
    await page.getByTestId("card-details-input").fill("Temporary card for the delete test");
    await page.getByTestId("submit-card-button").click();
    await expect(modal).not.toBeVisible();

    const card = page.locator('[data-testid^="card-"]', { hasText: "Card To Delete" });
    await expect(card).toBeVisible();

    // Hover card to expose delete button
    await card.hover();
    await card.getByRole("button", { name: /delete card/i }).click();

    await expect(card).not.toBeVisible();
    await expect(page.getByText("Card To Delete")).not.toBeVisible();
  });

  test("should allow dragging and dropping a card to another column", async ({ page }) => {
    const card = page.getByTestId("card-1");
    const targetColumn = page.getByTestId("column-droppable-3");

    await card.hover();
    await page.mouse.down();
    const targetBox = await targetColumn.boundingBox();
    if (targetBox) {
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    // Verify target column contains card
    await expect(targetColumn.getByTestId("card-1")).toBeVisible();
  });

  test("should allow dragging a card into a completely empty column", async ({ page }) => {
    // Delete single card in column 4 (Review) to make it empty
    const cardInColumn4 = page.getByTestId("card-7");
    await cardInColumn4.hover();
    await page.getByTestId("delete-card-7").click();
    await expect(cardInColumn4).not.toBeVisible();
    await expect(page.getByTestId("column-count-4")).toHaveText("0");

    // Drag card 1 from column 1 into column 4
    const cardToDrag = page.getByTestId("card-1");
    const emptyColumn = page.getByTestId("column-4");

    await cardToDrag.hover();
    await page.mouse.down();
    const targetBox = await emptyColumn.boundingBox();
    if (targetBox) {
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    // Verify empty column now contains card 1 and count is 1
    await expect(emptyColumn.getByTestId("card-1")).toBeVisible();
    await expect(page.getByTestId("column-count-4")).toHaveText("1");
  });
});
