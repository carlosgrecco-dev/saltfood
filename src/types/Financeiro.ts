import { CategoriaMovimentoCaixa, TipoMovimentoCaixa } from './MovimentoCaixa';

export interface FinanceiroStatPeriodo {
  atual: number;
  anterior: number;
}

export interface FinanceiroStats {
  entradas: FinanceiroStatPeriodo;
  saidas: FinanceiroStatPeriodo;
  saldo: FinanceiroStatPeriodo;
  pedidosPagos: FinanceiroStatPeriodo;
  ticketMedio: FinanceiroStatPeriodo;
  taxaCancelamentoPercent: FinanceiroStatPeriodo;
}

export interface FluxoCaixaPontoHora {
  hora: number;
  entradas: number;
  saidas: number;
  saldoAcumulado: number;
}

export interface FluxoCaixaPontoDia {
  data: string;
  entradas: number;
  saidas: number;
  saldoAcumulado: number;
}

export interface EntradaPorFormaPagamento {
  formaPagamento: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'MULTIPLO';
  valor: number;
}

export type CategoriaSaidaResumo = 'MOTOBOYS' | 'SANGRIAS' | CategoriaMovimentoCaixa;

export interface SaidaPorCategoria {
  categoria: CategoriaSaidaResumo;
  valor: number;
}

export interface MovimentacaoRecente {
  id: string;
  tipo: TipoMovimentoCaixa;
  descricao: string;
  categoria: CategoriaSaidaResumo | null;
  formaPagamento: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'MULTIPLO' | null;
  valor: number;
  data: string;
  usuario: 'Sistema' | 'Admin';
  pedidoNumero: number | null;
}

export interface RecebimentoFuturoBucket {
  valor: number;
  pedidos: number;
}

export interface RecebimentosFuturos {
  hoje: RecebimentoFuturoBucket;
  amanha: RecebimentoFuturoBucket;
  semana: RecebimentoFuturoBucket;
  total: number;
}

export interface ResumoGeralPeriodo {
  entradasTotais: number;
  saidasTotais: number;
  saldoLiquido: number;
  lucroBrutoEstimado: number;
}

export interface TopProdutoFinanceiro {
  produtoId: string;
  nome: string;
  quantidade: number;
  receita: number;
}

export interface EstoqueBaixoItem {
  produtoId: string;
  nome: string;
  estoqueQtd: number;
  estoqueMinimo: number;
}

export interface AlertasFinanceiros {
  motoboysPendentes: { quantidade: number; valor: number };
  pagamentosAguardandoConfirmacao: number;
  estoqueBaixo: EstoqueBaixoItem[];
  sangriaAcimaDaMedia: { hoje: number; media: number } | null;
}

export interface FinanceiroResumo {
  periodo: { de: string; ate: string };
  stats: FinanceiroStats;
  fluxoPorHora: FluxoCaixaPontoHora[];
  fluxoPorDia: FluxoCaixaPontoDia[];
  entradasPorFormaPagamento: EntradaPorFormaPagamento[];
  saidasPorCategoria: SaidaPorCategoria[];
  movimentacoesRecentes: MovimentacaoRecente[];
  recebimentosFuturos: RecebimentosFuturos;
  resumoGeral: ResumoGeralPeriodo;
  topProdutos: TopProdutoFinanceiro[];
  alertas: AlertasFinanceiros;
}

export interface MetaComProgresso {
  valorAlvo: number;
  atual: number;
}

export interface MetaProdutoComProgresso {
  produtoId: string;
  nome: string;
  valorAlvo: number;
  atual: number;
}

export interface MetasResumo {
  faturamento: MetaComProgresso;
  pedidos: MetaComProgresso;
  ticketMedio: MetaComProgresso;
  produtos: MetaProdutoComProgresso[];
}

export interface MetasInput {
  faturamento?: number | null;
  pedidos?: number | null;
  ticketMedio?: number | null;
  produtos?: { produtoId: string; valorAlvo: number }[];
}
