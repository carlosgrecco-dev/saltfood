export interface SuperAdminDashboard {
  totalEmpresas: number;
  empresasAtivas: number;
  empresasInativas: number;
  lojasComVendaNoPeriodo: number;
  totalClientes: number;
  totalMotoboysAtivos: number;
  gmv: number;
  totalPedidos: number;
  ticketMedio: number;
  comissaoTotal: number;
  // Campos adicionados numa extensão do dashboard — opcionais pra não quebrar a UI se o front
  // for atualizado antes da API em produção (o front deve sempre tratar a ausência deles).
  novosTenantsNoPeriodo?: number;
  pedidosPorDia?: { data: string; pedidos: number; faturamento: number }[];
  porFormaPagamento?: { forma: string; quantidade: number }[];
  porCategoria?: { categoriaId: string; nome: string; quantidade: number; receita: number; percentual: number }[];
  dispositivos?: { nome: string; quantidade: number }[];
  navegadores?: { nome: string; quantidade: number }[];
  usoFuncionalidades?: { recurso: string; tenantsUsando: number; percentual: number }[];
  porTenant?: {
    id: string;
    nome: string;
    slug: string;
    ativo: boolean;
    pedidosNoPeriodo: number;
    faturamentoNoPeriodo: number;
    ticketMedioNoPeriodo: number;
    ultimoPedidoEm: string | null;
    ultimoAcessoAdminEm: string | null;
  }[];
  atividadeRecente?: { tipo: string; descricao: string; data: string }[];
  alertas?: { faturasPendentes: number; tenantsInativos30Dias: number };
}
