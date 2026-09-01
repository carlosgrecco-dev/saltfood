export type TipoMovimentoCaixa = 'ENTRADA' | 'SAIDA' | 'SANGRIA' | 'FECHAMENTO';
export type CategoriaMovimentoCaixa = 'COMPRAS_ESTOQUE' | 'TAXAS_TARIFAS' | 'OUTROS';

export interface MovimentoCaixa {
  id: string;
  empresaId: string;
  motoboyId: string | null;
  tipo: TipoMovimentoCaixa;
  descricao: string | null;
  valor: number;
  dataMovimento: string;
  createdAt: string;
  pedidoId: string | null;
  formaPagamento: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'MULTIPLO' | null;
  categoria: CategoriaMovimentoCaixa | null;
}

export const TIPO_MOVIMENTO_LABELS: Record<TipoMovimentoCaixa, string> = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  SANGRIA: 'Sangria',
  FECHAMENTO: 'Fechamento',
};

export const CATEGORIA_MOVIMENTO_LABELS: Record<CategoriaMovimentoCaixa, string> = {
  COMPRAS_ESTOQUE: 'Compras / Estoque',
  TAXAS_TARIFAS: 'Taxas e tarifas',
  OUTROS: 'Outros',
};
