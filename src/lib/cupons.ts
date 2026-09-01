import { Cupom, CupomInput, CupomValidado, CupomAdminResumo } from '../types/Cupom';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';
import { getClienteSession } from './clienteSession';

/** Pública — usada na vitrine (guest ou cliente logado). Quando o cliente está logado, envia o
 * token pra ele também ver os cupons pessoais dele (clienteAlvoId), além dos públicos. */
export async function fetchCupons(empresaId: string, ativo?: boolean): Promise<Cupom[]> {
  const query = ativo !== undefined ? `?ativo=${ativo}` : '';
  const session = getClienteSession(empresaId);
  return apiRequest<Cupom[]>(`/empresas/${empresaId}/cupons${query}`, undefined, session?.token);
}

/** Visão do admin — inclui todos os cupons da loja, inclusive os pessoais de cada cliente. */
export async function fetchCuponsAsAdmin(empresaId: string, ativo?: boolean): Promise<Cupom[]> {
  const query = ativo !== undefined ? `?ativo=${ativo}` : '';
  return apiRequestAsAdmin<Cupom[]>(empresaId, `/empresas/${empresaId}/cupons${query}`);
}

/** Cupons com status calculado (ativo/agendado/expirado/esgotado) + estatísticas de uso do mês — pra tela de gestão do admin. */
export async function fetchCuponsAdminResumo(empresaId: string): Promise<CupomAdminResumo> {
  return apiRequestAsAdmin<CupomAdminResumo>(empresaId, `/empresas/${empresaId}/cupons/admin-resumo`);
}

export async function createCupom(empresaId: string, payload: CupomInput): Promise<Cupom> {
  return apiRequestAsAdmin<Cupom>(empresaId, `/empresas/${empresaId}/cupons`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateCupom(empresaId: string, id: string, payload: CupomInput): Promise<Cupom> {
  return apiRequestAsAdmin<Cupom>(empresaId, `/empresas/${empresaId}/cupons/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function setCupomStatus(empresaId: string, id: string, ativo: boolean): Promise<Cupom> {
  return apiRequestAsAdmin<Cupom>(empresaId, `/empresas/${empresaId}/cupons/${id}/status`, { method: 'PATCH', body: JSON.stringify({ ativo }) });
}

export async function deleteCupom(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/cupons/${id}`, { method: 'DELETE' });
}

/** Público (guest checkout também valida cupom) — quando o cliente estiver logado, envia o token pra elegibilidade de "primeira compra" ser conferida no servidor, nunca por um clienteId vindo do corpo. */
export async function validarCupom(empresaId: string, codigo: string, subtotal: number): Promise<CupomValidado> {
  const session = getClienteSession(empresaId);
  return apiRequest<CupomValidado>(`/empresas/${empresaId}/cupons/validar`, {
    method: 'POST',
    body: JSON.stringify({ codigo, subtotal }),
  }, session?.token);
}
