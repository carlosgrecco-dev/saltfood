export type RfmSegmento = 'CAMPEOES' | 'FIEIS' | 'POTENCIAIS' | 'EM_RISCO' | 'PERDIDOS';

export const RFM_SEGMENT_COLORS: Record<RfmSegmento, string> = {
  CAMPEOES: 'bg-emerald-500',
  FIEIS: 'bg-blue-500',
  POTENCIAIS: 'bg-teal-400',
  EM_RISCO: 'bg-amber-500',
  PERDIDOS: 'bg-gray-400',
};

export const RFM_SEGMENT_STROKE: Record<RfmSegmento, string> = {
  CAMPEOES: 'stroke-emerald-500',
  FIEIS: 'stroke-blue-500',
  POTENCIAIS: 'stroke-teal-400',
  EM_RISCO: 'stroke-amber-500',
  PERDIDOS: 'stroke-gray-400',
};

export interface DashboardResumo {
  porDia: { date: string; pedidos: number; novosClientes: number }[];
  porCategoria: { categoriaId: string; nome: string; quantidade: number; receita: number; percentual: number }[];
  tempoMedioEntregaMin: number | null;
  entregasNoPrazoPercent: number | null;
  cancelamentosPercent: number;
  clientesAtivos: number;
  pedidosPorClienteAtivo: number;
  taxaRecompraPercent: number;
  heatmap: { dia: number; hora: number; pedidos: number }[];
  funil: { recebidos: number; preparando: number; saiuEntrega: number; entregues: number; cancelados: number };
  topMotoboys: { motoboyId: string; motoboyNome: string; entregas: number; avaliacaoMedia: number | null }[];
  statusHoje: { status: string; quantidade: number }[];
  rfm: { segmento: RfmSegmento; label: string; quantidade: number }[];
  avaliacoesRecentes: {
    id: string;
    numero: number;
    clienteNome: string | null;
    notaPedido: number;
    comentarioPedido: string | null;
    avaliadoEm: string;
  }[];
  caixa: {
    sessaoAberta: { operadorNome: string; abertoEm: string; fundoTroco: number } | null;
    entradasPeriodo: number;
    saidasPeriodo: number;
    saldoPeriodo: number;
    porDia: { date: string; entradas: number; saidas: number; saldo: number }[];
  };
  alertas: {
    estoqueBaixo: { produtoId: string; nome: string; estoqueQtd: number; estoqueMinimo: number }[];
    pedidosAtrasados: { pedidoId: string; numero: number; minutosDesdeOPedido: number }[];
    avaliacoesNegativas: { id: string; numero: number; notaPedido: number; comentarioPedido: string | null; avaliadoEm: string }[];
  };
}
