import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import type { PublicSite } from "@portfolio/shared";
import { AppRoutes } from "@/router";

/** Render the real routes at `path` with a mocked API. */
export function renderAt(path: string, data: PublicSite, onPost?: (body: unknown) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST")
        return onPost?.(JSON.parse(String(init.body))) ?? new Response("{}", { status: 201 });
      if (String(url).endsWith("/site")) return Response.json(data);
      return Response.json({ error: { code: "not_found", message: "Not found" } }, { status: 404 });
    }),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
