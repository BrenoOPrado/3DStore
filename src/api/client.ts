import type { Snapshot } from "./types";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new ApiError(data.error || "Não foi possível concluir a requisição.");
  }
  return data;
}

export async function apiMutate(path: string, init?: RequestInit): Promise<Snapshot & Record<string, unknown>> {
  try {
    return await api<Snapshot & Record<string, unknown>>(path, init);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message } as Snapshot & Record<string, unknown> & { error: string };
    }
    throw err;
  }
}
