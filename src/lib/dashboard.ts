import { DashboardResumo } from '../types/Dashboard';
import { apiRequestAsAdmin } from './adminAuth';
import { apiRequest } from './apiClient';

export async function fetchDashboardResumo(empresaId: string, de: string, ate: string): Promise<DashboardResumo> {
  return apiRequestAsAdmin<DashboardResumo>(empresaId, `/empresas/${empresaId}/dashboard/resumo?de=${de}&ate=${ate}`);
}

const PRESENCE_SESSION_KEY = 'kifood_presence_session_id';

/** Id estável por aba do navegador, sem dado pessoal — usado só pra contar "usuários online". */
function getPresenceSessionId(): string {
  let id = sessionStorage.getItem(PRESENCE_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(PRESENCE_SESSION_KEY, id);
  }
  return id;
}

/** Chamado pelo storefront (sem autenticação) periodicamente enquanto a aba está aberta. */
export async function pingPresence(empresaId: string): Promise<void> {
  try {
    await apiRequest<void>(`/empresas/${empresaId}/presence/ping`, {
      method: 'POST',
      body: JSON.stringify({ sessionId: getPresenceSessionId() }),
    });
  } catch {
    /* silencioso — não é crítico perder um ping */
  }
}

export async function fetchPresenceCount(empresaId: string): Promise<number> {
  const { online } = await apiRequestAsAdmin<{ online: number }>(empresaId, `/empresas/${empresaId}/presence/count`);
  return online;
}
