import { SaltfoodCoinsReport } from '../types/SaltfoodCoinsReport';
import { CoinsMovimentoAdmin, ContaPlataformaAdmin } from '../types/SaltfoodCoinsAdmin';
import { apiRequestAsSuperAdmin } from './superAdminAuth';

export async function fetchSaltfoodCoinsReport(de?: string, ate?: string): Promise<SaltfoodCoinsReport> {
  const params = new URLSearchParams();
  if (de) params.set('de', de);
  if (ate) params.set('ate', ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsSuperAdmin<SaltfoodCoinsReport>(`/super-admin/saltfood-coins${query}`);
}

export interface FiltroMovimentos {
  empresaId?: string;
  tipo?: 'GANHO' | 'GASTO' | '';
  de?: string;
  ate?: string;
}

export async function fetchSaltfoodCoinsMovimentos(filtro: FiltroMovimentos = {}): Promise<CoinsMovimentoAdmin[]> {
  const params = new URLSearchParams();
  if (filtro.empresaId) params.set('empresaId', filtro.empresaId);
  if (filtro.tipo) params.set('tipo', filtro.tipo);
  if (filtro.de) params.set('de', filtro.de);
  if (filtro.ate) params.set('ate', filtro.ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsSuperAdmin<CoinsMovimentoAdmin[]>(`/super-admin/saltfood-coins/movimentos${query}`);
}

export async function fetchSaltfoodCoinsContas(q?: string): Promise<ContaPlataformaAdmin[]> {
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiRequestAsSuperAdmin<ContaPlataformaAdmin[]>(`/super-admin/saltfood-coins/contas${query}`);
}
