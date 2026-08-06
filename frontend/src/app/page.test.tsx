import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AuthProvider } from "@/components/AuthProvider";
import { routerMock } from "@/vitest.setup";
import Home from "./page";

describe("Home page", () => {
  it("redirects to /boards when already signed in", async () => {
    global.fetch = vi.fn((input) => {
      const url = typeof input === "string" ? input : String((input as Request).url);

      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ id: 1, email: "demo@kanban.app" }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    }) as unknown as typeof global.fetch;

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith("/boards");
    });
  });

  it("redirects to /sign-in when not signed in", async () => {
    global.fetch = vi.fn((input) => {
      const url = typeof input === "string" ? input : String((input as Request).url);

      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ detail: "Not authenticated" }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    }) as unknown as typeof global.fetch;

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith("/sign-in");
    });
  });
});
