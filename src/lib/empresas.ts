import { AparenciaInput, Empresa, EmpresaFormInput, EmpresaPublic, FidelidadeConfigInput, FuncionalidadesConfigInput } from '../types/Empresa';
import { apiRequest } from './apiClient';
import { apiRequestAsAdmin } from './adminAuth';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchEmpresas(search?: string): Promise<Empresa[]> {
  const query = search ? `?q=${encodeURIComponent(search)}` : '';
  return apiRequestAsSuperAdmin<Empresa[]>(`/empresas${query}`);
}

export async function fetchEmpresaById(id: string): Promise<Empresa> {
  return apiRequestAsAdmin<Empresa>(id, `/empresas/${id}`);
}

/** Lookup público usado para resolver a loja pelo slug da URL (rota /:slug). */
export async function fetchEmpresaPublicBySlug(slug: string): Promise<EmpresaPublic> {
  return apiRequest<EmpresaPublic>(`/empresas/slug/${encodeURIComponent(slug)}`);
}

export async function createEmpresa(input: EmpresaFormInput): Promise<Empresa> {
  return apiRequestAsSuperAdmin<Empresa>('/empresas', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateEmpresa(id: string, input: Omit<EmpresaFormInput, 'senha'>): Promise<Empresa> {
  return apiRequestAsSuperAdmin<Empresa>(`/empresas/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function deleteEmpresa(id: string): Promise<void> {
  return apiRequestAsSuperAdmin<void>(`/empresas/${id}`, { method: 'DELETE' });
}

export async function setEmpresaStatus(id: string, ativo: boolean): Promise<Empresa> {
  return apiRequestAsSuperAdmin<Empresa>(`/empresas/${id}/status-empresa`, { method: 'PATCH', body: JSON.stringify({ ativo }) });
}

export async function setAdminStatus(id: string, ativo: boolean): Promise<Empresa> {
  return apiRequestAsSuperAdmin<Empresa>(`/empresas/${id}/status-admin`, { method: 'PATCH', body: JSON.stringify({ ativo }) });
}

export async function resetEmpresaSenha(id: string, senha: string): Promise<Empresa> {
  return apiRequestAsSuperAdmin<Empresa>(`/empresas/${id}/reset-senha`, { method: 'POST', body: JSON.stringify({ senha }) });
}

export async function setComissaoEmpresa(id: string, comissaoPercent: number): Promise<Empresa> {
  return apiRequestAsSuperAdmin<Empresa>(`/empresas/${id}/comissao`, { method: 'PATCH', body: JSON.stringify({ comissaoPercent }) });
}

export async function setComissaoVisibilidade(id: string, ocultarComissaoTenant: boolean): Promise<Empresa> {
  return apiRequestAsSuperAdmin<Empresa>(`/empresas/${id}/comissao-visibilidade`, {
    method: 'PATCH',
    body: JSON.stringify({ ocultarComissaoTenant }),
  });
}

/** Só o Super Admin liga/desliga e configura o percentual do SaltFood Coins — diferente das demais
 * funcionalidades opt-in (essas o próprio lojista controla em FuncionalidadesTab). */
export async function setSaltfoodCoinsConfig(id: string, participaSaltfoodCoins: boolean, saltfoodCoinsPercent: number | null): Promise<Empresa> {
  return apiRequestAsSuperAdmin<Empresa>(`/empresas/${id}/saltfood-coins`, {
    method: 'PATCH',
    body: JSON.stringify({ participaSaltfoodCoins, saltfoodCoinsPercent }),
  });
}

export async function updateAparencia(id: string, input: AparenciaInput): Promise<Empresa> {
  return apiRequestAsAdmin<Empresa>(id, `/empresas/${id}/aparencia`, { method: 'PUT', body: JSON.stringify(input) });
}

/** Botão de emergência "Loja Aberta/Fechada" no topo do painel admin. */
export async function setLojaAberta(id: string, aberta: boolean): Promise<Empresa> {
  return apiRequestAsAdmin<Empresa>(id, `/empresas/${id}/loja-aberta`, { method: 'PATCH', body: JSON.stringify({ aberta }) });
}

export interface OperacionalInput {
  usarHorarioAutomatico: boolean;
  tempoEstimadoMin: number | null;
  tempoEstimadoMax: number | null;
  pedidoMinimo: number;
}

export async function updateOperacional(id: string, input: OperacionalInput): Promise<Empresa> {
  return apiRequestAsAdmin<Empresa>(id, `/empresas/${id}/operacional`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function updateFreteConfig(id: string, freteGratisAcimaDe: number | null): Promise<Empresa> {
  return apiRequestAsAdmin<Empresa>(id, `/empresas/${id}/frete-config`, { method: 'PUT', body: JSON.stringify({ freteGratisAcimaDe }) });
}

/** Atribui (ou remove, com planoId=null) o plano de assinatura da empresa; sincroniza a comissão com a do plano. */
export async function setEmpresaPlano(id: string, planoId: string | null): Promise<Empresa> {
  return apiRequestAsSuperAdmin<Empresa>(`/empresas/${id}/plano`, { method: 'PATCH', body: JSON.stringify({ planoId }) });
}

export async function updateFidelidadeConfig(id: string, input: FidelidadeConfigInput): Promise<Empresa> {
  return apiRequestAsAdmin<Empresa>(id, `/empresas/${id}/fidelidade-config`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function updateFuncionalidadesConfig(id: string, input: FuncionalidadesConfigInput): Promise<Empresa> {
  return apiRequestAsAdmin<Empresa>(id, `/empresas/${id}/funcionalidades-config`, { method: 'PUT', body: JSON.stringify(input) });
}
