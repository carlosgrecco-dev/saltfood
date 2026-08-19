import { MotoboySession } from '../types/Motoboy';
import { apiRequest, ApiError } from './apiClient';

const storageKey = (empresaId: string) => `motoboy_session_${empresaId}`;

export function getMotoboySession(empresaId: string): MotoboySession | null {
  const raw = localStorage.getItem(storageKey(empresaId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MotoboySession;
  } catch {
    return null;
  }
}

export function saveMotoboySession(session: MotoboySession): void {
  localStorage.setItem(storageKey(session.empresaId), JSON.stringify(session));
}

export function clearMotoboySession(empresaId: string): void {
  localStorage.removeItem(storageKey(empresaId));
}

/**
 * Igual a apiRequest, mas injeta o token do motoboy logado nesta empresa. Em 401, limpa a sessão
 * local e avisa a UI via evento — o portal volta pro formulário de login.
 */
export async function apiRequestAsMotoboy<T>(empresaId: string, path: string, init?: RequestInit): Promise<T> {
  const session = getMotoboySession(empresaId);
  try {
    return await apiRequest<T>(path, init, session?.token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearMotoboySession(empresaId);
      window.dispatchEvent(new CustomEvent('kifood:session-expired', { detail: { kind: 'motoboy', empresaId } }));
    }
    throw err;
  }
}

export { ApiError };
