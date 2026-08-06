import { test, expect, type Locator, type Page } from "@playwright/test";

// dnd-kit's PointerSensor only starts a drag once the pointer has moved past
// an activation distance threshold. A single teleporting `mouse.move` to the
// destination can land before the browser has dispatched enough intermediate
// pointermove events to cross that threshold, so dnd-kit never starts the
// drag and the drop silently no-ops. Nudging a few pixels first, then
// re-reading the drop target's position right before releasing (rather than
// reusing a box captured before the drag began), makes this reliable.
async function dragCardTo(page: Page, card: Locator, target: Locator) {
  const cardBox = await card.boundingBox();
  if (!cardBox) {
    throw new Error("Card to drag has no bounding box.");
  }
  const cardCenterX = cardBox.x + cardBox.width / 2;
  const cardCenterY = cardBox.y + cardBox.height / 2;

  await page.mouse.move(cardCenterX, cardCenterY);
  await page.mouse.down();
  await page.mouse.move(cardCenterX + 10, cardCenterY + 10, { steps: 5 });
  await page.waitForTimeout(100);

  const targetBox = await target.boundingBox();
  if (!targetBox) {
    throw new Error("Drop target has no bounding box.");
  }
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 15,
  });
  await page.waitForTimeout(100);
  await page.mouse.up();
}

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

    // Scope to the specific card instead of matching by text globally: a
    // previous run against this shared database may have left a card with
    // identical text behind, which would make a page-wide text match
    // ambiguous. The new card is appended to the end of the column.
    const newCard = page
      .locator('[data-testid^="card-"]', { hasText: "Automated Test Task" })
      .last();
    await expect(newCard).toBeVisible();
    await expect(newCard.getByText("Details for automated test card")).toBeVisible();

    // Clean up so the suite doesn't accumulate duplicate cards across runs.
    await newCard.hover();
    await newCard.getByRole("button", { name: /delete card/i }).click();
    await expect(newCard).not.toBeVisible();
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

    await dragCardTo(page, card, targetColumn);

    // Verify target column contains card
    await expect(targetColumn.getByTestId("card-1")).toBeVisible();
  });

  test("should allow dragging a card into a completely empty column", async ({ page }) => {
    const emptyColumn = page.getByTestId("column-4");
    const countBadge = page.getByTestId("column-count-4");
    const cardsInColumn = emptyColumn.locator('[data-testid^="card-"]');

    // `.count()` below reads the DOM synchronously and doesn't auto-wait, so
    // make sure the board has actually finished its initial fetch first
    // (the beforeEach only waits for the page heading, not the board data).
    await expect(countBadge).toBeVisible();

    // Empty column 4 of whatever it currently holds. The suite runs against
    // one persistent local database rather than a fresh one per run, so this
    // must not assume a specific seed card (e.g. "card-7") is still there.
    while ((await cardsInColumn.count()) > 0) {
      const card = cardsInColumn.first();
      await card.hover();
      await card.getByRole("button", { name: /delete card/i }).click();
      await expect(card).not.toBeVisible();
    }
    await expect(countBadge).toHaveText("0");

    // Drag whichever card currently sits first on the board into column 4.
    const cardToDrag = page.locator('[data-testid^="card-"]').first();
    const cardTestId = await cardToDrag.getAttribute("data-testid");
    if (!cardTestId) {
      throw new Error("Expected at least one card on the board to drag.");
    }

    await dragCardTo(page, cardToDrag, emptyColumn);

    // Verify empty column now contains the dragged card and count is 1
    await expect(emptyColumn.getByTestId(cardTestId)).toBeVisible();
    await expect(countBadge).toHaveText("1");
  });
});
