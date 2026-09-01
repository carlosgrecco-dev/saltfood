import { Motoboy, MotoboyAdminResumo, PagamentosMotoboyResumo } from '../types/Motoboy';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';
import { apiRequestAsMotoboy } from './motoboySession';

export interface MotoboyPayload {
  nome: string;
  telefone?: string;
  taxaPadrao?: number;
  ativo?: boolean;
  veiculoTipo?: string | null;
  veiculoPlaca?: string | null;
  turno?: string | null;
  fotoPerfilUrl?: string | null;
  cnhUrl?: string | null;
  documentoVeiculoUrl?: string | null;
  seguroUrl?: string | null;
  comprovanteResidenciaUrl?: string | null;
}

export async function fetchMotoboys(empresaId: string, ativo?: boolean): Promise<Motoboy[]> {
  const query = ativo !== undefined ? `?ativo=${ativo}` : '';
  return apiRequestAsAdmin<Motoboy[]>(empresaId, `/empresas/${empresaId}/motoboys${query}`);
}

/** Motoboys com status calculado, avaliação média e entregas totais + estatísticas da equipe. */
export async function fetchMotoboysAdminResumo(empresaId: string): Promise<MotoboyAdminResumo> {
  return apiRequestAsAdmin<MotoboyAdminResumo>(empresaId, `/empresas/${empresaId}/motoboys/admin-resumo`);
}

/** Histórico de pagamentos (pendente + pago) com período/entregas/valores reconstruídos. */
export async function fetchPagamentosMotoboyResumo(empresaId: string, de?: string, ate?: string): Promise<PagamentosMotoboyResumo> {
  const params = new URLSearchParams();
  if (de) params.set('de', de);
  if (ate) params.set('ate', ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsAdmin<PagamentosMotoboyResumo>(empresaId, `/empresas/${empresaId}/motoboys/pagamentos-resumo${query}`);
}

export async function createMotoboy(empresaId: string, payload: MotoboyPayload): Promise<Motoboy> {
  return apiRequestAsAdmin<Motoboy>(empresaId, `/empresas/${empresaId}/motoboys`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateMotoboy(empresaId: string, id: string, payload: MotoboyPayload): Promise<Motoboy> {
  return apiRequestAsAdmin<Motoboy>(empresaId, `/empresas/${empresaId}/motoboys/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function setMotoboyStatus(empresaId: string, id: string, ativo: boolean): Promise<Motoboy> {
  return apiRequestAsAdmin<Motoboy>(empresaId, `/empresas/${empresaId}/motoboys/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ ativo }),
  });
}

export async function setMotoboyPin(empresaId: string, id: string, pin: string): Promise<Motoboy> {
  return apiRequestAsAdmin<Motoboy>(empresaId, `/empresas/${empresaId}/motoboys/${id}/pin`, {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
}

export async function deleteMotoboy(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/motoboys/${id}`, { method: 'DELETE' });
}

export async function loginMotoboy(empresaId: string, telefone: string, pin: string): Promise<{ id: string; nome: string; disponivel: boolean; token: string }> {
  return apiRequest<{ id: string; nome: string; disponivel: boolean; token: string }>(`/empresas/${empresaId}/motoboys/login`, {
    method: 'POST',
    body: JSON.stringify({ telefone, pin }),
  });
}

/** Compartilha a posição GPS atual do motoboy (gratuito, via navigator.geolocation do navegador). */
export async function updateMotoboyLocalizacao(empresaId: string, id: string, latitude: number, longitude: number): Promise<Motoboy> {
  return apiRequestAsMotoboy<Motoboy>(empresaId, `/empresas/${empresaId}/motoboys/${id}/localizacao`, {
    method: 'PATCH',
    body: JSON.stringify({ latitude, longitude }),
  });
}

/** O próprio motoboy liga/desliga "disponível pra corrida" no portal dele — escopo só desta loja. */
export async function setMotoboyDisponibilidade(empresaId: string, id: string, disponivel: boolean): Promise<Motoboy> {
  return apiRequestAsMotoboy<Motoboy>(empresaId, `/empresas/${empresaId}/motoboys/${id}/disponibilidade`, {
    method: 'PATCH',
    body: JSON.stringify({ disponivel }),
  });
}
