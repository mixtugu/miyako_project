export class ApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`Request failed (${status})`);
    this.status = status;
  }
}

export async function writeApi(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown, password?: string): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (password !== undefined) headers["X-Admin-Password"] = password;
  const response = await fetch(path, {
    method, headers, credentials: "same-origin", redirect: "error",
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new ApiError(response.status);
}
