import type { BlogList, BlogPost, ContactMessageInput, PublicSite } from "@portfolio/shared";

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/v1/public${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "network_error", "Network error — check your connection.");
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(res.status, err?.code ?? "http_error", err?.message ?? res.statusText);
  }
  return body as T;
}

export interface BlogQuery {
  q?: string;
  tag?: string;
  page?: number;
}

export const api = {
  site: () => request<PublicSite>("/site"),
  blogList: ({ q, tag, page }: BlogQuery) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    if (page && page > 1) params.set("page", String(page));
    const qs = params.toString();
    return request<BlogList>(`/blog${qs ? `?${qs}` : ""}`);
  },
  blogPost: (slug: string) => request<BlogPost>(`/blog/${encodeURIComponent(slug)}`),
  contact: (input: ContactMessageInput) =>
    request<{ ok: true }>("/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  rssUrl: `${BASE}/api/v1/public/blog/rss.xml`,
};
