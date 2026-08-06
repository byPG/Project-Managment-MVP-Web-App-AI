import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "@/components/AuthProvider";
import { routerMock } from "@/vitest.setup";
import SignInPage from "./page";

describe("SignInPage", () => {
  beforeEach(() => {
    global.fetch = vi.fn((input, init) => {
      const url = typeof input === "string" ? input : String((input as Request).url);

      if (url.includes("/api/health")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "ok" }),
        });
      }

      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ detail: "Not authenticated" }),
        });
      }

      if (url.includes("/api/auth/sign-in")) {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        const isValid = body.email === "demo@kanban.app" && body.password === "password123";

        return Promise.resolve({
          ok: isValid,
          status: isValid ? 200 : 401,
          json: () =>
            Promise.resolve(
              isValid
                ? { id: 1, email: "demo@kanban.app" }
                : { detail: "Invalid email or password" },
            ),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    }) as unknown as typeof global.fetch;
  });

  it("signs in and redirects to /boards", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SignInPage />
      </AuthProvider>,
    );

    await screen.findByText(/Backend online/i);

    await user.type(screen.getByLabelText(/email/i), "demo@kanban.app");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith("/boards");
    });
  });

  it("shows an error message when credentials are invalid", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SignInPage />
      </AuthProvider>,
    );

    await screen.findByText(/Backend online/i);

    await user.type(screen.getByLabelText(/email/i), "demo@kanban.app");
    await user.type(screen.getByLabelText(/password/i), "bad-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
