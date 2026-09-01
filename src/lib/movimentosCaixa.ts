import { MovimentoCaixa, TipoMovimentoCaixa, CategoriaMovimentoCaixa } from '../types/MovimentoCaixa';
import { apiRequestAsAdmin } from './adminAuth';
import { apiRequestAsMotoboy, getMotoboySession } from './motoboySession';

export interface MovimentoCaixaFiltro {
  tipo?: TipoMovimentoCaixa;
  motoboyId?: string;
  de?: string;
  ate?: string;
}

export interface MovimentoCaixaPayload {
  tipo: TipoMovimentoCaixa;
  valor: number;
  descricao?: string;
  motoboyId?: string | null;
  dataMovimento?: string;
  categoria?: CategoriaMovimentoCaixa | null;
}

/** Lê tanto pelo admin (caixa completo) quanto pelo dashboard do motoboy (só os próprios pagamentos). */
export async function fetchMovimentosCaixa(empresaId: string, filtro: MovimentoCaixaFiltro = {}): Promise<MovimentoCaixa[]> {
  const params = new URLSearchParams();
  if (filtro.tipo) params.set('tipo', filtro.tipo);
  if (filtro.motoboyId) params.set('motoboyId', filtro.motoboyId);
  if (filtro.de) params.set('de', filtro.de);
  if (filtro.ate) params.set('ate', filtro.ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  const path = `/empresas/${empresaId}/movimentos-caixa${query}`;

  if (getMotoboySession(empresaId)) {
    return apiRequestAsMotoboy<MovimentoCaixa[]>(empresaId, path);
  }
  return apiRequestAsAdmin<MovimentoCaixa[]>(empresaId, path);
}

export async function createMovimentoCaixa(empresaId: string, payload: MovimentoCaixaPayload): Promise<MovimentoCaixa> {
  return apiRequestAsAdmin<MovimentoCaixa>(empresaId, `/empresas/${empresaId}/movimentos-caixa`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteMovimentoCaixa(empresaId: string, id: string): Promise<void> {
  return apiRequestAsAdmin<void>(empresaId, `/empresas/${empresaId}/movimentos-caixa/${id}`, { method: 'DELETE' });
}
