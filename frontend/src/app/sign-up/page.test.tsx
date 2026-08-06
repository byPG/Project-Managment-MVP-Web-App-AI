import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "@/components/AuthProvider";
import { routerMock } from "@/vitest.setup";
import SignUpPage from "./page";

describe("SignUpPage", () => {
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

      if (url.includes("/api/auth/sign-up")) {
        const body = init?.body ? JSON.parse(String(init.body)) : {};

        if (body.email === "taken@example.com") {
          return Promise.resolve({
            ok: false,
            status: 409,
            json: () =>
              Promise.resolve({ detail: "An account with this email already exists" }),
          });
        }

        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ id: 2, email: body.email }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    }) as unknown as typeof global.fetch;
  });

  it("creates an account and redirects to /boards", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SignUpPage />
      </AuthProvider>,
    );

    await screen.findByText(/Backend online/i);

    await user.type(screen.getByLabelText(/email/i), "new-user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith("/boards");
    });
  });

  it("shows an error message for a duplicate email", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SignUpPage />
      </AuthProvider>,
    );

    await screen.findByText(/Backend online/i);

    await user.type(screen.getByLabelText(/email/i), "taken@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });
});
