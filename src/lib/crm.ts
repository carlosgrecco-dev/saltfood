import { CrmSummary } from '../types/Crm';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchCrmResumo(empresaId: string, de: string, ate: string): Promise<CrmSummary> {
  const params = new URLSearchParams({ de, ate });
  return apiRequestAsAdmin<CrmSummary>(empresaId, `/empresas/${empresaId}/crm/resumo?${params.toString()}`);
}
