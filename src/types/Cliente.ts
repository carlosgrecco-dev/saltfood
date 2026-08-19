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
