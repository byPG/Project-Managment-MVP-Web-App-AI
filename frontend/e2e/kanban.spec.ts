import { test, expect } from "@playwright/test";

test.describe("Kanban Board MVP", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should render five columns with initial dummy cards", async ({ page }) => {
    const board = page.getByTestId("kanban-board");
    await expect(board).toBeVisible();

    const columns = page.locator('[data-testid^="column-col-"]');
    await expect(columns).toHaveCount(5);

    await expect(page.getByTestId("column-title-col-1")).toContainText("Backlog");
    await expect(page.getByTestId("column-title-col-2")).toContainText("To Do");
    await expect(page.getByTestId("column-title-col-3")).toContainText("In Progress");
    await expect(page.getByTestId("column-title-col-4")).toContainText("Review");
    await expect(page.getByTestId("column-title-col-5")).toContainText("Done");

    // Dummy card initial check
    await expect(page.getByTestId("card-card-1")).toBeVisible();
    await expect(page.getByText("Research competitors")).toBeVisible();
  });

  test("should allow renaming a column", async ({ page }) => {
    const titleBtn = page.getByTestId("column-title-col-1");
    await titleBtn.click();

    const titleInput = page.getByTestId("column-title-input-col-1");
    await expect(titleInput).toBeVisible();

    await titleInput.fill("Ideas & Backlog");
    await titleInput.press("Enter");

    await expect(page.getByTestId("column-title-col-1")).toContainText("Ideas & Backlog");
  });

  test("should allow adding a new card to a selected column", async ({ page }) => {
    const addCardBtn = page.getByTestId("add-card-button-col-1");
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
    const card = page.getByTestId("card-card-1");
    await expect(card).toBeVisible();

    // Hover card to expose delete button
    await card.hover();
    const deleteBtn = page.getByTestId("delete-card-card-1");
    await deleteBtn.click();

    await expect(card).not.toBeVisible();
    await expect(page.getByText("Research competitors")).not.toBeVisible();
  });

  test("should allow dragging and dropping a card to another column", async ({ page }) => {
    const card = page.getByTestId("card-card-1");
    const targetColumn = page.getByTestId("column-droppable-col-3");

    await card.hover();
    await page.mouse.down();
    const targetBox = await targetColumn.boundingBox();
    if (targetBox) {
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    // Verify target column contains card
    await expect(targetColumn.getByTestId("card-card-1")).toBeVisible();
  });

  test("should allow dragging a card into a completely empty column", async ({ page }) => {
    // Delete single card in col-4 (Review) to make it empty
    const cardInCol4 = page.getByTestId("card-card-7");
    await cardInCol4.hover();
    await page.getByTestId("delete-card-card-7").click();
    await expect(cardInCol4).not.toBeVisible();
    await expect(page.getByTestId("column-count-col-4")).toHaveText("0");

    // Drag card-1 from col-1 into col-4
    const cardToDrag = page.getByTestId("card-card-1");
    const emptyColumn = page.getByTestId("column-col-4");

    await cardToDrag.hover();
    await page.mouse.down();
    const targetBox = await emptyColumn.boundingBox();
    if (targetBox) {
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    // Verify empty column now contains card-1 and count is 1
    await expect(emptyColumn.getByTestId("card-card-1")).toBeVisible();
    await expect(page.getByTestId("column-count-col-4")).toHaveText("1");
  });
});
