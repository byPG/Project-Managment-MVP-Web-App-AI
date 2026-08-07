import { test, expect, type Locator, type Page } from "@playwright/test";
import { openBoard, signUpFreshUser } from "./helpers";

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

test.describe("Kanban board", () => {
  // Every test signs up a fresh user and uses that user's own default board
  // (seeded with 5 columns + 8 dummy cards on signup), so column/card ids
  // are never hardcoded - each run gets its own isolated, real database rows
  // instead of sharing one persistent seed.
  test.beforeEach(async ({ page }) => {
    await signUpFreshUser(page);
    await openBoard(page, "My First Board");
  });

  test("renders five columns with seeded dummy cards", async ({ page }) => {
    await expect(page.getByTestId("kanban-board")).toBeVisible();

    const columnTitles = page.getByTestId(/^column-title-\d+$/);
    await expect(columnTitles).toHaveCount(5);
    await expect(columnTitles.nth(0)).toContainText("Backlog");
    await expect(columnTitles.nth(1)).toContainText("To Do");
    await expect(columnTitles.nth(2)).toContainText("In Progress");
    await expect(columnTitles.nth(3)).toContainText("Review");
    await expect(columnTitles.nth(4)).toContainText("Done");

    await expect(page.getByText("Research competitors")).toBeVisible();
  });

  test("allows renaming a column", async ({ page }) => {
    const titleBtn = page.getByTestId(/^column-title-\d+$/).first();
    await expect(titleBtn).toContainText("Backlog");
    await titleBtn.click();

    const titleInput = page.getByTestId(/^column-title-input-\d+$/);
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Ideas & Backlog");
    await titleInput.press("Enter");

    await expect(page.getByTestId(/^column-title-\d+$/).first()).toContainText("Ideas & Backlog");
  });

  test("allows adding a new card to a column", async ({ page }) => {
    await page.getByTestId(/^add-card-button-\d+$/).first().click();

    const modal = page.getByTestId("add-card-modal");
    await expect(modal).toBeVisible();

    await page.getByTestId("card-title-input").fill("Automated Test Task");
    await page.getByTestId("card-details-input").fill("Details for automated test card");
    await page.getByTestId("submit-card-button").click();

    await expect(modal).not.toBeVisible();
    await expect(page.getByText("Automated Test Task")).toBeVisible();
    await expect(page.getByText("Details for automated test card")).toBeVisible();
  });

  test("allows editing an existing card", async ({ page }) => {
    const card = page.locator('[data-testid^="card-"]', { hasText: "Research competitors" });
    await card.hover();
    await card.getByRole("button", { name: /edit card/i }).click();

    const modal = page.getByTestId("edit-card-modal");
    await expect(modal).toBeVisible();
    await expect(page.getByTestId("card-title-input")).toHaveValue("Research competitors");

    await page.getByTestId("card-title-input").fill("Research competitors thoroughly");
    await page.getByTestId("submit-card-button").click();

    await expect(modal).not.toBeVisible();
    await expect(page.getByText("Research competitors thoroughly")).toBeVisible();
  });

  test("allows deleting a card", async ({ page }) => {
    await page.getByTestId(/^add-card-button-\d+$/).first().click();
    await page.getByTestId("card-title-input").fill("Card To Delete");
    await page.getByTestId("submit-card-button").click();

    const card = page.locator('[data-testid^="card-"]', { hasText: "Card To Delete" });
    await expect(card).toBeVisible();

    await card.hover();
    await card.getByRole("button", { name: /delete card/i }).click();

    await expect(card).not.toBeVisible();
  });

  test("allows dragging a card to another column", async ({ page }) => {
    const card = page.getByTestId(/^card-\d+$/).first();
    const targetColumn = page.getByTestId(/^column-droppable-\d+$/).nth(2); // In Progress

    const cardTestId = await card.getAttribute("data-testid");
    if (!cardTestId) {
      throw new Error("Expected the dragged card to have a data-testid.");
    }

    await dragCardTo(page, card, targetColumn);

    await expect(targetColumn.getByTestId(cardTestId)).toBeVisible();
  });

  test("allows dragging a card into a fully emptied column", async ({ page }) => {
    const emptyColumn = page.getByTestId(/^column-\d+$/).nth(3); // Review
    const countBadge = page.getByTestId(/^column-count-\d+$/).nth(3);
    const cardsInColumn = emptyColumn.locator('[data-testid^="card-"]');

    await expect(countBadge).toBeVisible();

    while ((await cardsInColumn.count()) > 0) {
      const card = cardsInColumn.first();
      await card.hover();
      await card.getByRole("button", { name: /delete card/i }).click();
      await expect(card).not.toBeVisible();
    }
    await expect(countBadge).toHaveText("0");

    const cardToDrag = page.getByTestId(/^card-\d+$/).first();
    const cardTestId = await cardToDrag.getAttribute("data-testid");
    if (!cardTestId) {
      throw new Error("Expected at least one card on the board to drag.");
    }

    await dragCardTo(page, cardToDrag, emptyColumn);

    await expect(emptyColumn.getByTestId(cardTestId)).toBeVisible();
    await expect(countBadge).toHaveText("1");
  });

  test("allows adding, reordering, and deleting a column", async ({ page }) => {
    await page.getByTestId("add-column-button").click();
    await page.getByTestId("add-column-input").fill("Blocked");
    await page.getByTestId("add-column-submit").click();

    const columnTitles = page.getByTestId(/^column-title-\d+$/);
    await expect(columnTitles).toHaveCount(6);
    await expect(columnTitles.nth(5)).toContainText("Blocked");

    const newColumn = page.getByTestId(/^column-\d+$/).nth(5);
    const newColumnId = await newColumn.getAttribute("data-testid");
    if (!newColumnId) {
      throw new Error("Expected the new column to have a data-testid.");
    }
    const columnNumber = newColumnId.replace("column-", "");

    await page.getByTestId(`move-column-left-${columnNumber}`).click();
    await expect(columnTitles.nth(4)).toContainText("Blocked");

    await page.getByTestId(`delete-column-${columnNumber}`).click();
    await expect(page.getByTestId(/^column-title-\d+$/)).toHaveCount(5);
  });
});
