export type TipoCupom = 'PERCENTUAL' | 'VALOR_FIXO' | 'FRETE_GRATIS';
export type StatusCupomCalculado = 'ATIVO' | 'AGENDADO' | 'EXPIRADO' | 'ESGOTADO' | 'INATIVO';
export type FormaPagamentoCupom = 'PIX' | 'DINHEIRO' | 'CARTAO';

export const TIPO_CUPOM_LABELS: Record<TipoCupom, string> = {
  PERCENTUAL: 'Percentual',
  VALOR_FIXO: 'Valor fixo',
  FRETE_GRATIS: 'Frete grátis',
};

export const STATUS_CUPOM_LABELS: Record<StatusCupomCalculado, string> = {
  ATIVO: 'Ativo',
  AGENDADO: 'Agendado',
  EXPIRADO: 'Expirado',
  ESGOTADO: 'Esgotado',
  INATIVO: 'Inativo',
};

export const FORMA_PAGAMENTO_CUPOM_LABELS: Record<FormaPagamentoCupom, string> = {
  PIX: 'PIX',
  DINHEIRO: 'Dinheiro',
  CARTAO: 'Cartão na entrega',
};

export const DIAS_SEMANA_LABELS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

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
  validoDe: string | null;
  validoAte: string | null;
  ativo: boolean;
  /** Quando preenchido, o cupom é pessoal — só esse cliente pode aplicá-lo. Null = cupom público. */
  clienteAlvoId: string | null;
  bairrosRestritos: string[];
  formaPagamentoRestrita: FormaPagamentoCupom | null;
  diaSemanaRestrito: number | null;
  apenasClientesFieis: boolean;
  createdAt: string;
  updatedAt: string;
  /** Só presente na resposta de /cupons/admin-resumo. */
  statusCalculado?: StatusCupomCalculado;
}

export interface CupomInput {
  codigo: string;
  descricao?: string;
  tipo: TipoCupom;
  valor?: number;
  apenasPrimeiraCompra?: boolean;
  valorMinimoPedido?: number;
  usoMaximo?: number;
  validoDe?: string;
  validoAte?: string;
  ativo?: boolean;
  clienteAlvoId?: string | null;
  bairrosRestritos?: string[];
  formaPagamentoRestrita?: FormaPagamentoCupom | null;
  diaSemanaRestrito?: number | null;
  apenasClientesFieis?: boolean;
}

export interface CupomValidado {
  codigo: string;
  tipo: TipoCupom;
  descricao: string | null;
  desconto: number;
  freteGratis: boolean;
}

export interface CupomAdminStats {
  total: number;
  ativos: number;
  agendados: number;
  expirados: number;
  usosMesAtual: number;
  usosMesAnterior: number;
  descontoMesAtual: number;
  descontoMesAnterior: number;
  ticketMedioComCupom: number;
  economiaMediaPorPedido: number;
  topCupons: { codigo: string; usos: number }[];
  porTipo: { tipo: TipoCupom; quantidade: number }[];
}

export interface CupomAdminResumo {
  cupons: Cupom[];
  stats: CupomAdminStats;
}
