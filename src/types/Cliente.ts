export interface Cliente {
  id: string;
  empresaId: string;
  nome: string;
  telefone: string | null;
  email: string;
  totalUnidadesCompradas: number;
  itensGratisGanhos: number;
  itensGratisResgatados: number;
  itemGratisGanhoEm: string | null;
  codigoIndicacao: string | null;
  indicadoPorId: string | null;
  indicacoesConcluidas: number;
  saldoCashback: number;
  /** Já vinculado a uma conta SaltFood Coins (compartilhada entre lojas)? Ver contaPlataformaDetectada abaixo pro caso "ainda não, mas existe uma pra vincular". */
  contaPlataformaId?: string | null;
  /** true quando existe uma conta SaltFood Coins com este e-mail em outra loja, mas ESTE cliente ainda não está vinculado a ela — front pode oferecer vincular (com confirmação de senha). */
  contaPlataformaDetectada?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const LOYALTY_STAMPS_GOAL = 10;

export function loyaltyProgress(cliente: Pick<Cliente, 'totalUnidadesCompradas'>) {
  const currentCycle = cliente.totalUnidadesCompradas % LOYALTY_STAMPS_GOAL;
  return {
    stamps: currentCycle,
    goal: LOYALTY_STAMPS_GOAL,
    remaining: currentCycle === 0 ? LOYALTY_STAMPS_GOAL : LOYALTY_STAMPS_GOAL - currentCycle,
  };
}

export function loyaltyFreeItemsAvailable(cliente: Pick<Cliente, 'itensGratisGanhos' | 'itensGratisResgatados'>) {
  return Math.max(0, cliente.itensGratisGanhos - cliente.itensGratisResgatados);
}

export type LoyaltyTier = 'BRONZE' | 'PRATA' | 'OURO';

export const LOYALTY_TIER_LABELS: Record<LoyaltyTier, string> = {
  BRONZE: 'Bronze',
  PRATA: 'Prata',
  OURO: 'Ouro',
};

/** Nível de fidelidade calculado sobre o total histórico de unidades compradas — cosmético, não altera nenhuma regra de resgate. */
export function loyaltyTier(cliente: Pick<Cliente, 'totalUnidadesCompradas'>): LoyaltyTier {
  if (cliente.totalUnidadesCompradas >= 50) return 'OURO';
  if (cliente.totalUnidadesCompradas >= 20) return 'PRATA';
  return 'BRONZE';
}

/** Marcos de indicações concluídas que liberam bônus — espelha api/src/lib/indicacao.js MARCOS_INDICACAO. */
export const MARCOS_INDICACAO = [3, 10, 25];

export type NivelIndicadorTipo = 'INICIANTE' | LoyaltyTier;

export const NIVEL_INDICADOR_LABELS: Record<NivelIndicadorTipo, string> = {
  INICIANTE: 'Iniciante',
  ...LOYALTY_TIER_LABELS,
};

export interface NivelIndicador {
  nivel: NivelIndicadorTipo;
  faltamProximoMarco: number | null;
}

/** Nível de indicador calculado sobre indicacoesConcluidas — só relevante com Empresa.habilitarIndicacaoAvancada=true. */
export function indicadorNivel(cliente: Pick<Cliente, 'indicacoesConcluidas'>): NivelIndicador {
  const total = cliente.indicacoesConcluidas;
  const proximoMarco = MARCOS_INDICACAO.find((m) => total < m) ?? null;
  if (total >= 25) return { nivel: 'OURO', faltamProximoMarco: null };
  if (total >= 10) return { nivel: 'PRATA', faltamProximoMarco: proximoMarco != null ? proximoMarco - total : null };
  if (total >= 3) return { nivel: 'BRONZE', faltamProximoMarco: proximoMarco != null ? proximoMarco - total : null };
  return { nivel: 'INICIANTE', faltamProximoMarco: proximoMarco != null ? proximoMarco - total : null };
}

export interface LoyaltyExpiracao {
  disponiveis: number;
  expiraEm: Date | null;
  expirado: boolean;
}

/**
 * Disponibilidade real do item grátis considerando o prazo de resgate configurado pela loja
 * (Empresa.fidelidadeValidadeDias). Espelha a mesma lógica usada no backend (api/src/lib/fidelidade.js)
 * para exibir o contador regressivo — a validação de verdade continua sendo feita no checkout.
 */
export function loyaltyExpiracao(
  cliente: Pick<Cliente, 'itensGratisGanhos' | 'itensGratisResgatados' | 'itemGratisGanhoEm'>,
  empresa: { fidelidadeValidadeDias: number | null }
): LoyaltyExpiracao {
  const disponiveis = loyaltyFreeItemsAvailable(cliente);

  if (disponiveis === 0) {
    return { disponiveis: 0, expiraEm: null, expirado: false };
  }
  if (!empresa.fidelidadeValidadeDias || !cliente.itemGratisGanhoEm) {
    return { disponiveis, expiraEm: null, expirado: false };
  }

  const expiraEm = new Date(cliente.itemGratisGanhoEm);
  expiraEm.setDate(expiraEm.getDate() + empresa.fidelidadeValidadeDias);
  const expirado = new Date() > expiraEm;

  return { disponiveis: expirado ? 0 : disponiveis, expiraEm, expirado };
}
