import { Fatura, GerarFaturaInput, GerarLoteInput, GerarLoteResultado, StatusFatura } from '../types/Fatura';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchFaturas(filtro: { empresaId?: string; status?: StatusFatura } = {}): Promise<Fatura[]> {
  const params = new URLSearchParams();
  if (filtro.empresaId) params.set('empresaId', filtro.empresaId);
  if (filtro.status) params.set('status', filtro.status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsSuperAdmin<Fatura[]>(`/faturas${query}`);
}

export async function gerarFatura(input: GerarFaturaInput): Promise<Fatura> {
  return apiRequestAsSuperAdmin<Fatura>('/faturas/gerar', { method: 'POST', body: JSON.stringify(input) });
}

export async function gerarFaturasEmLote(input: GerarLoteInput): Promise<GerarLoteResultado> {
  return apiRequestAsSuperAdmin<GerarLoteResultado>('/faturas/gerar-lote', { method: 'POST', body: JSON.stringify(input) });
}

export async function setFaturaStatus(id: string, status: StatusFatura): Promise<Fatura> {
  return apiRequestAsSuperAdmin<Fatura>(`/faturas/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function deleteFatura(id: string): Promise<void> {
  return apiRequestAsSuperAdmin<void>(`/faturas/${id}`, { method: 'DELETE' });
}
