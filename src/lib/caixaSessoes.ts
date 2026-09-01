import { CaixaSessao, CaixaSessaoComMovimentos, ResumoCaixaSessao } from '../types/CaixaSessao';
import { apiRequestAsAdmin } from './adminAuth';

export interface AbrirCaixaInput {
  operadorId?: string;
  operadorNome?: string;
  fundoTroco?: number;
}

export async function abrirCaixa(empresaId: string, input: AbrirCaixaInput): Promise<CaixaSessao> {
  return apiRequestAsAdmin<CaixaSessao>(empresaId, `/empresas/${empresaId}/caixa-sessoes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** null quando não há caixa aberto no momento. */
export async function fetchCaixaAberta(empresaId: string): Promise<CaixaSessao | null> {
  return apiRequestAsAdmin<CaixaSessao | null>(empresaId, `/empresas/${empresaId}/caixa-sessoes/aberta`);
}

export async function fetchCaixaSessoes(empresaId: string, filtro: { status?: 'ABERTO' | 'FECHADO'; de?: string; ate?: string } = {}): Promise<CaixaSessao[]> {
  const params = new URLSearchParams();
  if (filtro.status) params.set('status', filtro.status);
  if (filtro.de) params.set('de', filtro.de);
  if (filtro.ate) params.set('ate', filtro.ate);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequestAsAdmin<CaixaSessao[]>(empresaId, `/empresas/${empresaId}/caixa-sessoes${query}`);
}

export async function fetchCaixaSessaoById(empresaId: string, id: string): Promise<CaixaSessaoComMovimentos> {
  return apiRequestAsAdmin<CaixaSessaoComMovimentos>(empresaId, `/empresas/${empresaId}/caixa-sessoes/${id}`);
}

export async function fetchResumoCaixaSessao(empresaId: string, id: string): Promise<ResumoCaixaSessao> {
  return apiRequestAsAdmin<ResumoCaixaSessao>(empresaId, `/empresas/${empresaId}/caixa-sessoes/${id}/resumo`);
}

export async function fecharCaixa(empresaId: string, id: string, valorContado: number, observacoesFechamento?: string): Promise<CaixaSessao & { resumo: ResumoCaixaSessao }> {
  return apiRequestAsAdmin<CaixaSessao & { resumo: ResumoCaixaSessao }>(empresaId, `/empresas/${empresaId}/caixa-sessoes/${id}/fechar`, {
    method: 'POST',
    body: JSON.stringify({ valorContado, observacoesFechamento }),
  });
}
