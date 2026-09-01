import { FinanceiroResumo, MetasResumo, MetasInput } from '../types/Financeiro';
import { ExtratoResumo } from '../types/ContaFinanceira';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchFinanceiroResumo(empresaId: string, de?: string, ate?: string): Promise<FinanceiroResumo> {
  const params = new URLSearchParams();
  if (de) params.set('de', de);
  if (ate) params.set('ate', ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsAdmin<FinanceiroResumo>(empresaId, `/empresas/${empresaId}/financeiro/resumo${query}`);
}

export async function fetchExtrato(empresaId: string, de?: string, ate?: string): Promise<ExtratoResumo> {
  const params = new URLSearchParams();
  if (de) params.set('de', de);
  if (ate) params.set('ate', ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsAdmin<ExtratoResumo>(empresaId, `/empresas/${empresaId}/financeiro/extrato${query}`);
}

export async function fetchMetas(empresaId: string): Promise<MetasResumo> {
  return apiRequestAsAdmin<MetasResumo>(empresaId, `/empresas/${empresaId}/financeiro/metas`);
}

export async function salvarMetas(empresaId: string, input: MetasInput): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/financeiro/metas`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
