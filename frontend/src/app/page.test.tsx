import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "./page";

describe("Home page", () => {
  beforeEach(() => {
    global.fetch = vi.fn((input, init) => {
      const url = typeof input === "string" ? input : String((input as Request).url);

      if (url.includes("/api/health")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "ok" }),
        });
      }

      if (url.includes("/api/auth/sign-in")) {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        const isValid =
          body.email === "demo@kanban.app" && body.password === "password123";

        return Promise.resolve({
          ok: isValid,
          status: isValid ? 200 : 401,
          json: () =>
            Promise.resolve(
              isValid
                ? { status: "ok", email: "demo@kanban.app" }
                : { detail: "Invalid email or password" },
            ),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    }) as unknown as typeof global.fetch;
  });

  it("renders the sign-in page and shows the board after successful sign in", async () => {
    const user = userEvent.setup();

    render(<Home />);

    expect(screen.getByRole("heading", { name: /sign in to your workspace/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    await screen.findByText(/Backend online/i);

    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), "demo@kanban.app");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("heading", { name: /kanban board/i })).toBeInTheDocument();
  });

  it("shows an error message when sign-in credentials are invalid", async () => {
    const user = userEvent.setup();

    render(<Home />);

    await screen.findByText(/Backend online/i);

    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), "demo@kanban.app");
    await user.type(screen.getByLabelText(/password/i), "bad-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
