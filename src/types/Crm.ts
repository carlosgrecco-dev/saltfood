export interface CrmSummary {
  totalRevenue: number;
  totalUnits: number;
  totalOrders: number;
  ticketMedio: number;
  avgRating: number;
  ratingCount: number;
  byPayment: { formaPagamento: string; total: number }[];
  daily: { date: string; total: number; pedidos: number; ticketMedio: number; clientesNovos: number }[];
  motoboyClosing: {
    motoboyId: string;
    motoboyNome: string;
    corridasConcluidas: number;
    corridasCanceladas: number;
    totalAPagar: number;
  }[];
  comissaoPercent: number;
  comissaoValor: number;
  descontosTotais: number;
  mostrarComissao: boolean;
  topProdutos: { produtoId: string; nome: string; quantidade: number; receita: number }[];
  porHora: { hora: number; pedidos: number }[];
  porStatus: { status: string; quantidade: number }[];
  porBairro: { bairro: string; pedidos: number; total: number }[];
  porDiaSemana: { dia: number; pedidos: number }[];
  novosVsRecorrentes: { novos: number; recorrentes: number };
  cuponsUsados: { codigo: string; usos: number; descontoTotal: number }[];
  porTipoPedido: { tipoPedido: string; total: number; quantidade: number }[];
  curvaAbc: { produtoId: string | null; nome: string; quantidade: number; receita: number; percentualAcumulado: number; classe: 'A' | 'B' | 'C' }[];
  topClientesPorGasto: { clienteId: string; nome: string; pedidos: number; gasto: number }[];
  clientesPorFrequencia: { umPedido: number; doisACinco: number; seisADez: number; onzeOuMais: number };
}
