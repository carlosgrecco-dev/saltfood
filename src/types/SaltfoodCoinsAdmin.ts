export interface CoinsMovimentoAdmin {
  id: string;
  tipo: 'GANHO' | 'GASTO';
  valor: number;
  createdAt: string;
  empresa: { id: string; nome: string; slug: string };
  cliente: { id: string; nome: string; email: string };
  pedido: { id: string; numero: number } | null;
}

export interface ContaPlataformaAdmin {
  id: string;
  email: string;
  telefone: string | null;
  saldoCoins: number;
  createdAt: string;
  clientes: { id: string; nome: string; empresa: { id: string; nome: string } }[];
}
