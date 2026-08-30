import { LeadComercial, LeadComercialInput, StatusLeadComercial } from '../types/LeadComercial';
import { apiRequest } from './apiClient';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

/** Sem autenticação — enviado pelo drawer de contato do site público. */
export async function enviarLeadComercial(input: LeadComercialInput): Promise<void> {
  await apiRequest<{ id: string }>('/leads-comerciais', { method: 'POST', body: JSON.stringify(input) });
}

export async function fetchLeadsComerciais(status?: StatusLeadComercial): Promise<LeadComercial[]> {
  const query = status ? `?status=${status}` : '';
  return apiRequestAsSuperAdmin<LeadComercial[]>(`/leads-comerciais${query}`);
}

export async function updateLeadComercial(
  id: string,
  input: { status?: StatusLeadComercial; notaInterna?: string },
): Promise<LeadComercial> {
  return apiRequestAsSuperAdmin<LeadComercial>(`/leads-comerciais/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}
