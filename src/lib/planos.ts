import { Plano, PlanoInput, PlanoPublico } from '../types/Plano';
import { apiRequest } from './apiClient';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchPlanos(): Promise<Plano[]> {
  return apiRequestAsSuperAdmin<Plano[]>('/planos');
}

/** Sem autenticação — usado na vitrine pública do site (ver ParceiroPage.tsx). */
export async function fetchPlanosPublico(): Promise<PlanoPublico[]> {
  return apiRequest<PlanoPublico[]>('/planos/publico');
}

export async function createPlano(payload: PlanoInput): Promise<Plano> {
  return apiRequestAsSuperAdmin<Plano>('/planos', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updatePlano(id: string, payload: PlanoInput): Promise<Plano> {
  return apiRequestAsSuperAdmin<Plano>(`/planos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function setPlanoStatus(id: string, ativo: boolean): Promise<Plano> {
  return apiRequestAsSuperAdmin<Plano>(`/planos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ ativo }) });
}

export async function deletePlano(id: string): Promise<void> {
  return apiRequestAsSuperAdmin<void>(`/planos/${id}`, { method: 'DELETE' });
}
