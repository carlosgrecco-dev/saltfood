export type StatusCaixa = 'ABERTO' | 'FECHADO';

export interface CaixaSessao {
  id: string;
  empresaId: string;
  operadorId: string | null;
  operadorNome: string;
  fundoTroco: number;
  status: StatusCaixa;
  abertoEm: string;
  fechadoEm: string | null;
  valorContado: number | null;
  valorEsperado: number | null;
  diferenca: number | null;
}

export interface CaixaSessaoComMovimentos extends CaixaSessao {
  movimentos: { id: string; tipo: string; descricao: string | null; valor: number; formaPagamento: string | null; createdAt: string }[];
}

export interface ResumoCaixaSessao {
  fundoTroco: number;
  entradasPorForma: { PIX: number; DINHEIRO: number; CARTAO: number; MULTIPLO: number; SEM_FORMA: number };
  totalEntradas: number;
  totalSaidas: number;
  totalSangrias: number;
  totalSuprimentos: number;
  valorEsperado: number;
  quantidadeMovimentos: number;
}
