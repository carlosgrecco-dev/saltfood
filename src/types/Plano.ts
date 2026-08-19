export interface Plano {
  id: string;
  nome: string;
  valorMensal: number;
  comissaoPercent: number;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  recursos: string[];
  limitePedidosMes: number | null;
  limiteProdutos: number | null;
  limiteUsuarios: number | null;
  limiteEntregadores: number | null;
  destaque: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { empresas: number };
}

export interface PlanoInput {
  nome: string;
  valorMensal: number;
  comissaoPercent: number;
  descricao?: string;
  recursos?: string[];
  limitePedidosMes?: number | null;
  limiteProdutos?: number | null;
  limiteUsuarios?: number | null;
  limiteEntregadores?: number | null;
  destaque?: boolean;
}
