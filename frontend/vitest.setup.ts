import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

const { routerMock, useParamsMock } = vi.hoisted(() => ({
  routerMock: {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  },
  useParamsMock: vi.fn(() => ({})),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/",
  useParams: useParamsMock,
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  vi.clearAllMocks();
  useParamsMock.mockReturnValue({});
});

export { routerMock, useParamsMock };
