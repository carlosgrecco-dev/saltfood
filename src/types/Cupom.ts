export type TipoCupom = 'PERCENTUAL' | 'VALOR_FIXO' | 'FRETE_GRATIS';

export const TIPO_CUPOM_LABELS: Record<TipoCupom, string> = {
  PERCENTUAL: 'Percentual',
  VALOR_FIXO: 'Valor fixo',
  FRETE_GRATIS: 'Frete grátis',
};

export interface Cupom {
  id: string;
  empresaId: string;
  codigo: string;
  descricao: string | null;
  tipo: TipoCupom;
  valor: number | null;
  apenasPrimeiraCompra: boolean;
  valorMinimoPedido: number | null;
  usoMaximo: number | null;
  usosRealizados: number;
  validoAte: string | null;
  ativo: boolean;
  /** Quando preenchido, o cupom é pessoal — só esse cliente pode aplicá-lo. Null = cupom público. */
  clienteAlvoId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CupomInput {
  codigo: string;
  descricao?: string;
  tipo: TipoCupom;
  valor?: number;
  apenasPrimeiraCompra?: boolean;
  valorMinimoPedido?: number;
  usoMaximo?: number;
  validoAte?: string;
  ativo?: boolean;
  clienteAlvoId?: string | null;
}

export interface CupomValidado {
  codigo: string;
  tipo: TipoCupom;
  descricao: string | null;
  desconto: number;
  freteGratis: boolean;
}
