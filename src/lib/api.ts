export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiFetch<T>(
  path: string,
  options: { method?: Method; headers?: Record<string, string>; body?: any } = {}
): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
  const { method = "GET", headers = {}, body } = options;
  const isJson = body && !(body instanceof FormData);

  const res = await fetch(url, {
    method,
    headers: {
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: isJson ? JSON.stringify(body) : body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return (await res.json()) as T;
  // @ts-expect-error allow non-json
  return (await res.text()) as T;
}


