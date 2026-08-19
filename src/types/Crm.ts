export interface CrmSummary {
  totalRevenue: number;
  totalUnits: number;
  totalOrders: number;
  ticketMedio: number;
  avgRating: number;
  ratingCount: number;
  byPayment: { formaPagamento: string; total: number }[];
  daily: { date: string; total: number }[];
  motoboyClosing: {
    motoboyId: string;
    motoboyNome: string;
    corridasConcluidas: number;
    corridasCanceladas: number;
    totalAPagar: number;
  }[];
  comissaoPercent: number;
  comissaoValor: number;
  mostrarComissao: boolean;
  topProdutos: { produtoId: string; nome: string; quantidade: number; receita: number }[];
  porHora: { hora: number; pedidos: number }[];
  porStatus: { status: string; quantidade: number }[];
  porBairro: { bairro: string; pedidos: number; total: number }[];
  porDiaSemana: { dia: number; pedidos: number }[];
  novosVsRecorrentes: { novos: number; recorrentes: number };
  cuponsUsados: { codigo: string; usos: number; descontoTotal: number }[];
}
