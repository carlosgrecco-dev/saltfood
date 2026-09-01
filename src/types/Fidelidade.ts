import { Cliente } from './Cliente';

export interface ClienteFidelidade extends Cliente {
  /** Pedidos ENTREGUE deste cliente (todo o histórico). */
  pedidosCount: number;
  /** Soma do total dos pedidos ENTREGUE deste cliente (todo o histórico). */
  gastoTotal: number;
  ultimoPedidoEm: string | null;
  /** true quando o cliente teve pelo menos 1 pedido ENTREGUE nos últimos 60 dias. */
  ativo: boolean;
}

export interface FidelidadeStatPeriodo {
  atual: number;
  anterior: number;
}

export interface FidelidadeStats {
  clientesCadastrados: FidelidadeStatPeriodo;
  clientesAtivos: number;
  clientesAtivosPercent: number;
  carimbosEmitidos: FidelidadeStatPeriodo;
  itensGratisResgatados: FidelidadeStatPeriodo;
  economiaGerada: FidelidadeStatPeriodo;
}

export interface FidelidadeRankingItem {
  id: string;
  nome: string;
  totalUnidadesCompradas: number;
}

export type FidelidadeAtividadeTipo = 'RESGATE' | 'CASHBACK_USADO' | 'CARIMBO' | 'CASHBACK_CREDITADO';

export interface FidelidadeAtividade {
  tipo: FidelidadeAtividadeTipo;
  clienteNome: string;
  valor?: number;
  unidades?: number;
  pedidoNumero: number;
  data: string;
}

export interface FidelidadeConfig {
  fidelidadeValidadeDias: number | null;
  cashbackPercent: number;
  fidelidadeNomeItem: string | null;
  indicacaoRecompensaUnidades: number;
  unidadesParaPremio: number;
}

export interface FidelidadeAdminResumo {
  periodo: { de: string; ate: string };
  stats: FidelidadeStats;
  clientes: ClienteFidelidade[];
  ranking: FidelidadeRankingItem[];
  atividadesRecentes: FidelidadeAtividade[];
  config: FidelidadeConfig;
}
