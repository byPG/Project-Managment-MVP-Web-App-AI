import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useParamsMock } from "@/vitest.setup";
import BoardDetailPage from "./page";

describe("BoardDetailPage", () => {
  it("renders the board's columns and cards", async () => {
    useParamsMock.mockReturnValue({ boardId: "5" });

    global.fetch = vi.fn((input) => {
      const url = typeof input === "string" ? input : String((input as Request).url);

      if (url.includes("/api/boards/5")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 5,
              name: "Personal errands",
              columns: [
                { id: 1, name: "Backlog", position: 1, cards: [] },
                { id: 2, name: "To Do", position: 2, cards: [] },
                { id: 3, name: "In Progress", position: 3, cards: [] },
                { id: 4, name: "Review", position: 4, cards: [] },
                { id: 5, name: "Done", position: 5, cards: [] },
              ],
            }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    }) as unknown as typeof global.fetch;

    render(<BoardDetailPage />);

    expect(await screen.findByText("Personal errands")).toBeInTheDocument();
    expect(screen.getByTestId("column-1")).toBeInTheDocument();
    expect(screen.getByTestId("column-5")).toBeInTheDocument();
  });

  it("shows a not-found message for a board the user can't access", async () => {
    useParamsMock.mockReturnValue({ boardId: "999" });

    global.fetch = vi.fn(() => {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Board not found" }),
      });
    }) as unknown as typeof global.fetch;

    render(<BoardDetailPage />);

    expect(await screen.findByText("Board not found.")).toBeInTheDocument();
    expect(screen.getByText(/back to your boards/i)).toBeInTheDocument();
  });
});
