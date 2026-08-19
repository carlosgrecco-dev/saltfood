export type TipoMovimentoCaixa = 'ENTRADA' | 'SAIDA' | 'SANGRIA' | 'FECHAMENTO';

export interface MovimentoCaixa {
  id: string;
  empresaId: string;
  motoboyId: string | null;
  tipo: TipoMovimentoCaixa;
  descricao: string | null;
  valor: number;
  dataMovimento: string;
  createdAt: string;
}

export const TIPO_MOVIMENTO_LABELS: Record<TipoMovimentoCaixa, string> = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  SANGRIA: 'Sangria',
  FECHAMENTO: 'Fechamento',
};
