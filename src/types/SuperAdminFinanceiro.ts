import { FormaPagamento, StatusPedido } from './Pedido';

export interface TransacaoPlataforma {
  id: string;
  numero: number;
  total: number;
  formaPagamento: FormaPagamento;
  status: StatusPedido;
  createdAt: string;
  empresaId: string;
  empresaNome: string;
  empresaSlug: string;
  comissaoPercent: number;
  valorComissaoEstimado: number;
}

export interface FiltroTransacoes {
  empresaId?: string;
  formaPagamento?: FormaPagamento;
  status?: StatusPedido;
  de?: string;
  ate?: string;
}
