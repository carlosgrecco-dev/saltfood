import { CrmSummary } from '../types/Crm';
import { apiRequestAsAdmin, getAdminSession, ApiError } from './adminAuth';
import { API_URL } from './apiClient';

export async function fetchCrmResumo(empresaId: string, de: string, ate: string): Promise<CrmSummary> {
  const params = new URLSearchParams({ de, ate });
  return apiRequestAsAdmin<CrmSummary>(empresaId, `/empresas/${empresaId}/crm/resumo?${params.toString()}`);
}

/** Baixa o CSV do período direto no navegador do admin (a rota exige o header Authorization, por isso não dá pra usar um <a href> simples). */
export async function baixarCrmCsv(empresaId: string, de: string, ate: string): Promise<void> {
  const session = getAdminSession(empresaId);
  const params = new URLSearchParams({ de, ate });
  const res = await fetch(`${API_URL}/empresas/${empresaId}/crm/exportar-csv?${params.toString()}`, {
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
  });
  if (!res.ok) {
    throw new ApiError(`Erro ao exportar CSV (${res.status})`, res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos-${de}-a-${ate}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
