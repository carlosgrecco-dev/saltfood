import { PaginaSite, SiteBloco, SiteBlocoInput, SiteBlocoPublico } from '../types/SiteBloco';
import { apiRequest } from './apiClient';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchSiteBlocos(pagina?: PaginaSite): Promise<SiteBloco[]> {
  const query = pagina ? `?pagina=${pagina}` : '';
  return apiRequestAsSuperAdmin<SiteBloco[]>(`/site-blocos${query}`);
}

/** Sem autenticação — usado nas páginas públicas do site (ver hooks/useSiteBlocos.ts). */
export async function fetchSiteBlocosPublico(pagina: PaginaSite): Promise<SiteBlocoPublico[]> {
  return apiRequest<SiteBlocoPublico[]>(`/site-blocos/publico?pagina=${pagina}`);
}

export async function createSiteBloco(payload: SiteBlocoInput): Promise<SiteBloco> {
  return apiRequestAsSuperAdmin<SiteBloco>('/site-blocos', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateSiteBloco(id: string, payload: SiteBlocoInput): Promise<SiteBloco> {
  return apiRequestAsSuperAdmin<SiteBloco>(`/site-blocos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function setSiteBlocoStatus(id: string, ativo: boolean): Promise<SiteBloco> {
  return apiRequestAsSuperAdmin<SiteBloco>(`/site-blocos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ ativo }) });
}

export async function deleteSiteBloco(id: string): Promise<void> {
  return apiRequestAsSuperAdmin<void>(`/site-blocos/${id}`, { method: 'DELETE' });
}
