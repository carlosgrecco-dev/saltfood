import { CampanhaMarketing, CampanhaMarketingInput, StatusCampanhaMarketing } from '../types/SuperAdminCampanha';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchCampanhas(): Promise<CampanhaMarketing[]> {
  return apiRequestAsSuperAdmin<CampanhaMarketing[]>('/super-admin/campanhas');
}

export async function criarCampanha(input: CampanhaMarketingInput): Promise<CampanhaMarketing> {
  return apiRequestAsSuperAdmin<CampanhaMarketing>('/super-admin/campanhas', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function atualizarCampanha(id: string, input: Partial<CampanhaMarketingInput>): Promise<CampanhaMarketing> {
  return apiRequestAsSuperAdmin<CampanhaMarketing>(`/super-admin/campanhas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function atualizarStatusCampanha(id: string, status: StatusCampanhaMarketing): Promise<CampanhaMarketing> {
  return apiRequestAsSuperAdmin<CampanhaMarketing>(`/super-admin/campanhas/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function removerCampanha(id: string): Promise<void> {
  await apiRequestAsSuperAdmin<void>(`/super-admin/campanhas/${id}`, { method: 'DELETE' });
}
