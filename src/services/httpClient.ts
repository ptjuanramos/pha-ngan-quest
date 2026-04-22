import type { ApiResponse, ErrorBody } from "./types";

/**
 * Base URL for backend HTTP requests.
 * Override at build time with VITE_API_BASE_URL.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(error: ErrorBody, status: number) {
    super(error.message);
    this.code = error.code;
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Thin fetch wrapper that unwraps the standard `ApiResponse<T>` envelope
 * and throws an `ApiError` for non-2xx responses or non-null `error` fields.
 */
async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, signal } = opts;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    // empty / non-JSON response
  }

  if (!res.ok) {
    const err: ErrorBody = payload?.error ?? {
      code: `HTTP_${res.status}`,
      message: res.statusText || "Request failed",
    };
    throw new ApiError(err, res.status);
  }

  if (payload?.error) {
    throw new ApiError(payload.error, res.status);
  }

  return (payload?.data as T);
}

export const httpClient = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
