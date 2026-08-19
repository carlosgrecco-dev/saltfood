import { Plano, PlanoInput } from '../types/Plano';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchPlanos(): Promise<Plano[]> {
  return apiRequestAsSuperAdmin<Plano[]>('/planos');
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
