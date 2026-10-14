const BASE = `${(import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "")}/api/v1/admin`;
const TOKEN_KEY = "portfolio-admin.token";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

// ---- token storage (sessionStorage: cleared when the tab closes) ----

export interface StoredToken {
  token: string;
  expiresAt: string;
}

export function readToken(): StoredToken | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredToken;
    return Date.parse(parsed.expiresAt) > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export function writeToken(value: StoredToken | null): void {
  try {
    if (value) sessionStorage.setItem(TOKEN_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable — session lives in memory only
  }
}

// ---- 401 handling: AuthProvider subscribes and redirects to /login ----

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

export function onUnauthorized(listener: Listener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

// ---- requests ----

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Skip the session-expired handling (login itself returns 401 for bad passwords). */
  isAuthRequest?: boolean;
}

export async function request<T>(
  path: string,
  { method = "GET", body, isAuthRequest }: RequestOptions = {},
): Promise<T> {
  const token = readToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token.token}`;
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "network_error", "Network error");
  }

  if (res.status === 401 && !isAuthRequest) {
    writeToken(null);
    unauthorizedListeners.forEach((l) => l());
  }
  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)
      ?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "http_error",
      err?.message ?? res.statusText,
      err?.details,
    );
  }
  return data as T;
}

/** File download through the authenticated API (e.g. the JSON export). */
export async function download(path: string, filename: string): Promise<void> {
  const token = readToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token.token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, "download_failed", res.statusText);
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
