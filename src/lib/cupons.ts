import { Cupom, CupomInput, CupomValidado } from '../types/Cupom';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';
import { getClienteSession } from './clienteSession';

export async function fetchCupons(empresaId: string, ativo?: boolean): Promise<Cupom[]> {
  const query = ativo !== undefined ? `?ativo=${ativo}` : '';
  return apiRequest<Cupom[]>(`/empresas/${empresaId}/cupons${query}`);
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
