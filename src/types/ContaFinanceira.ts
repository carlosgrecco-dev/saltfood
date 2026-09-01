export type StatusConta = 'PENDENTE' | 'PAGO';

export interface ContaPagar {
  id: string;
  empresaId: string;
  descricao: string;
  fornecedorNome: string | null;
  valor: number;
  vencimento: string;
  status: StatusConta;
  pagoEm: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContaReceber {
  id: string;
  empresaId: string;
  descricao: string;
  clienteNome: string | null;
  valor: number;
  vencimento: string;
  status: StatusConta;
  recebidoEm: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContaPagarInput {
  descricao: string;
  fornecedorNome?: string;
  valor: number;
  vencimento: string;
  observacoes?: string;
}

export interface ContaReceberInput {
  descricao: string;
  clienteNome?: string;
  valor: number;
  vencimento: string;
  observacoes?: string;
}

export interface ExtratoLancamento {
  id: string;
  data: string;
  origem: 'CAIXA' | 'CONTA_PAGAR' | 'CONTA_RECEBER';
  tipo: string;
  descricao: string;
  valor: number;
  sinal: 1 | -1;
  saldoAcumulado: number;
}

export interface ExtratoResumo {
  lancamentos: ExtratoLancamento[];
  saldoFinal: number;
}
