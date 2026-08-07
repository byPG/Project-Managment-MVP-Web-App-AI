import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BoardsPage from "./page";

describe("BoardsPage", () => {
  beforeEach(() => {
    const boards = [{ id: 1, name: "My First Board" }];

    global.fetch = vi.fn((input, init) => {
      const url = typeof input === "string" ? input : String((input as Request).url);
      const method = init?.method ?? "GET";

      if (url.includes("/api/boards") && method === "GET") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(boards),
        });
      }

      if (url.includes("/api/boards") && method === "POST") {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        const created = { id: boards.length + 1, name: body.name };
        boards.push(created);
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve(created),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch call: ${method} ${url}`));
    }) as unknown as typeof global.fetch;
  });

  it("lists boards returned by the API", async () => {
    render(<BoardsPage />);

    expect(await screen.findByText("My First Board")).toBeInTheDocument();
  });

  it("creates a board and refreshes the list", async () => {
    const user = userEvent.setup();
    render(<BoardsPage />);

    await screen.findByText("My First Board");

    await user.type(screen.getByTestId("board-name-input"), "Second board");
    await user.click(screen.getByTestId("create-board-button"));

    await waitFor(() => {
      expect(screen.getByTestId("board-card-2")).toBeInTheDocument();
    });
  });
});
