import { TransacaoPlataforma, FiltroTransacoes } from '../types/SuperAdminFinanceiro';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchTransacoesPlataforma(filtro: FiltroTransacoes = {}): Promise<TransacaoPlataforma[]> {
  const params = new URLSearchParams();
  if (filtro.empresaId) params.set('empresaId', filtro.empresaId);
  if (filtro.formaPagamento) params.set('formaPagamento', filtro.formaPagamento);
  if (filtro.status) params.set('status', filtro.status);
  if (filtro.de) params.set('de', filtro.de);
  if (filtro.ate) params.set('ate', filtro.ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsSuperAdmin<TransacaoPlataforma[]>(`/super-admin/financeiro/transacoes${query}`);
}
