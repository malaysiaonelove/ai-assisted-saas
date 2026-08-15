const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('sb_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // keep the default message
    }
    throw new ApiError(res.status, message);
  }

  return (await res.json()) as T;
}

export const apiGet = <T>(path: string) => api<T>(path);
export const apiPost = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
export const apiPatch = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) });
export const apiDelete = <T>(path: string) => api<T>(path, { method: 'DELETE' });
