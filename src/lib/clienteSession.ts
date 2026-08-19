import { apiRequest, ApiError } from './apiClient';

export interface ClienteSessionData {
  clienteId: string;
  token: string;
}

const storageKey = (empresaId: string) => `cliente_session_${empresaId}`;

export function getClienteSession(empresaId: string): ClienteSessionData | null {
  const raw = localStorage.getItem(storageKey(empresaId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClienteSessionData;
  } catch {
    return null;
  }
}

export function getClienteId(empresaId: string): string | null {
  return getClienteSession(empresaId)?.clienteId ?? null;
}

export function saveClienteSession(empresaId: string, session: ClienteSessionData): void {
  localStorage.setItem(storageKey(empresaId), JSON.stringify(session));
}

export function clearClienteId(empresaId: string): void {
  localStorage.removeItem(storageKey(empresaId));
}

/**
 * Igual a apiRequest, mas injeta o token do cliente logado nesta empresa (quando houver — várias
 * rotas que usam isso, como checkout e validar cupom, também funcionam sem login). Em 401, limpa
 * a sessão local e avisa a UI via evento.
 */
export async function apiRequestAsCliente<T>(empresaId: string, path: string, init?: RequestInit): Promise<T> {
  const session = getClienteSession(empresaId);
  try {
    return await apiRequest<T>(path, init, session?.token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearClienteId(empresaId);
      window.dispatchEvent(new CustomEvent('kifood:session-expired', { detail: { kind: 'cliente', empresaId } }));
    }
    throw err;
  }
}

export { ApiError };
