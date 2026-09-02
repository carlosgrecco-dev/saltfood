import { apiRequest, ApiError } from './apiClient';
import { PapelUsuarioAdmin } from '../types/UsuarioAdmin';

export interface AdminSession {
  id: string;
  nome: string;
  usuario: string;
  token: string;
  /** Presentes só quando a sessão é de um usuário secundário (login de equipe), não do login master. */
  usuarioAdminId?: string;
  papel?: PapelUsuarioAdmin;
}

const storageKey = (empresaId: string) => `admin_session_${empresaId}`;

export function getAdminSession(empresaId: string): AdminSession | null {
  const raw = sessionStorage.getItem(storageKey(empresaId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export async function loginAdmin(empresaId: string, usuario: string, senha: string): Promise<AdminSession> {
  const session = await apiRequest<AdminSession>(`/empresas/${empresaId}/admin-login`, {
    method: 'POST',
    body: JSON.stringify({ usuario, senha }),
  });
  sessionStorage.setItem(storageKey(empresaId), JSON.stringify(session));
  return session;
}

/** Login de equipe (usuário secundário, aditivo ao login master acima) — mesmo armazenamento de sessão, então o resto do app não precisa saber a diferença. */
export async function loginUsuarioAdmin(empresaId: string, email: string, senha: string): Promise<AdminSession> {
  const resposta = await apiRequest<{ id: string; nome: string; email: string; papel: AdminSession['papel']; token: string }>(
    `/empresas/${empresaId}/usuarios-admin/login`,
    { method: 'POST', body: JSON.stringify({ email, senha }) }
  );
  const session: AdminSession = {
    id: resposta.id,
    nome: resposta.nome,
    usuario: resposta.email,
    token: resposta.token,
    usuarioAdminId: resposta.id,
    papel: resposta.papel,
  };
  sessionStorage.setItem(storageKey(empresaId), JSON.stringify(session));
  return session;
}

export function logoutAdmin(empresaId: string): void {
  sessionStorage.removeItem(storageKey(empresaId));
}

/**
 * Acha a sessão de admin ativa nesta aba sem saber de antemão o empresaId — útil pra código como
 * o upload de imagem, que não tem o id da loja à mão em todo ponto onde é chamado. Como o painel
 * é sempre acessado por /{slug}/admin, só existe uma loja logada por aba na prática.
 */
export function getAnyAdminSession(): AdminSession | null {
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key || !key.startsWith('admin_session_')) continue;
    const raw = sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      return JSON.parse(raw) as AdminSession;
    } catch {
      /* ignora entrada corrompida */
    }
  }
  return null;
}

/**
 * Igual a apiRequest, mas injeta o token do admin logado nesta empresa. Se a API responder 401
 * (sessão inválida/expirada, ou acesso desativado por trás de requireEmpresaAdmin), limpa a
 * sessão local e avisa a UI via evento — quem estiver escutando volta pro formulário de login.
 */
export async function apiRequestAsAdmin<T>(empresaId: string, path: string, init?: RequestInit): Promise<T> {
  const session = getAdminSession(empresaId);
  try {
    return await apiRequest<T>(path, init, session?.token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      logoutAdmin(empresaId);
      window.dispatchEvent(new CustomEvent('kifood:session-expired', { detail: { kind: 'admin', empresaId } }));
    }
    throw err;
  }
}

export { ApiError };
