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
}
