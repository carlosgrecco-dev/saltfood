import { Missao, MissaoInput, MissaoComProgresso, MissaoParticipacao } from '../types/Missao';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';
import { apiRequestAsCliente } from './clienteSession';

const base = (empresaId: string) => `/empresas/${empresaId}/missoes`;

/** Pública — devolve Missao[] simples pra guest/admin sem cliente logado, ou MissaoComProgresso[] quando um cliente está logado (o backend decide pela role do token). */
export async function fetchMissoes(empresaId: string): Promise<(Missao | MissaoComProgresso)[]> {
  return apiRequest<(Missao | MissaoComProgresso)[]>(base(empresaId));
}

/** O cliente logado é identificado pelo token (apiRequestAsCliente já injeta), não precisa de um clienteId explícito aqui. */
export async function fetchMissoesComoCliente(empresaId: string): Promise<MissaoComProgresso[]> {
  return apiRequestAsCliente<MissaoComProgresso[]>(empresaId, base(empresaId));
}

export async function fetchMissoesAsAdmin(empresaId: string): Promise<Missao[]> {
  return apiRequestAsAdmin<Missao[]>(empresaId, base(empresaId));
}

export async function createMissao(empresaId: string, payload: MissaoInput): Promise<Missao> {
  return apiRequestAsAdmin<Missao>(empresaId, base(empresaId), { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateMissao(empresaId: string, id: string, payload: MissaoInput): Promise<Missao> {
  return apiRequestAsAdmin<Missao>(empresaId, `${base(empresaId)}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function setMissaoStatus(empresaId: string, id: string, ativo: boolean): Promise<Missao> {
  return apiRequestAsAdmin<Missao>(empresaId, `${base(empresaId)}/${id}/status`, { method: 'PATCH', body: JSON.stringify({ ativo }) });
}

export async function deleteMissao(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `${base(empresaId)}/${id}`, { method: 'DELETE' });
}

export async function aceitarMissao(empresaId: string, id: string): Promise<MissaoParticipacao> {
  return apiRequestAsCliente<MissaoParticipacao>(empresaId, `${base(empresaId)}/${id}/aceitar`, { method: 'POST' });
}
