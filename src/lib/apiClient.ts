export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  // Headers() normaliza qualquer forma de HeadersInit (Headers, string[][] ou objeto) — espalhar
  // init.headers direto com "..." só funciona certo se já for um objeto simples; um Headers de
  // verdade não tem propriedades próprias enumeráveis e os headers passados seriam perdidos.
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Erro ao comunicar com a API (${res.status})`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
