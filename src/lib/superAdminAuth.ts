import { apiRequest, ApiError } from './apiClient';

const STORAGE_KEY = 'superadmin_session';

export interface SuperAdminSession {
  usuario: string;
  token: string;
}

export function getSuperAdminSession(): SuperAdminSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SuperAdminSession;
  } catch {
    return null;
  }
}

export async function signInSuperAdmin(usuario: string, senha: string): Promise<SuperAdminSession> {
  const session = await apiRequest<SuperAdminSession>('/super-admin/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, senha }),
  });
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function signOutSuperAdmin(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Igual a apiRequest, mas injeta o token do Super Admin. Em 401, limpa a sessão local e avisa a
 * UI via evento — as páginas de Super Admin voltam pro login.
 */
export async function apiRequestAsSuperAdmin<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getSuperAdminSession();
  try {
    return await apiRequest<T>(path, init, session?.token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      signOutSuperAdmin();
      window.dispatchEvent(new CustomEvent('kifood:session-expired', { detail: { kind: 'superadmin' } }));
    }
    throw err;
  }
}

export { ApiError };
