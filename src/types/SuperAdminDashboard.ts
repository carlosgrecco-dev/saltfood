export interface SuperAdminDashboard {
  totalEmpresas: number;
  empresasAtivas: number;
  empresasInativas: number;
  novosTenantsNoPeriodo: number;
  lojasComVendaNoPeriodo: number;
  totalClientes: number;
  totalMotoboysAtivos: number;
  gmv: number;
  totalPedidos: number;
  ticketMedio: number;
  comissaoTotal: number;
  pedidosPorDia: { data: string; pedidos: number }[];
  dispositivos: { nome: string; quantidade: number }[];
  navegadores: { nome: string; quantidade: number }[];
  usoFuncionalidades: { recurso: string; tenantsUsando: number; percentual: number }[];
  porTenant: {
    id: string;
    nome: string;
    slug: string;
    ativo: boolean;
    pedidosNoPeriodo: number;
    ultimoPedidoEm: string | null;
    ultimoAcessoAdminEm: string | null;
  }[];
}
