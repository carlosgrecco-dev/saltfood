export type StatusMotoboyCalculado = 'DISPONIVEL' | 'EM_ENTREGA' | 'OFFLINE' | 'INATIVO';

export const STATUS_MOTOBOY_LABELS: Record<StatusMotoboyCalculado, string> = {
  DISPONIVEL: 'Disponível',
  EM_ENTREGA: 'Em entrega',
  OFFLINE: 'Offline',
  INATIVO: 'Inativo',
};

export interface Motoboy {
  id: string;
  empresaId: string;
  nome: string;
  telefone: string | null;
  taxaPadrao: number;
  ativo: boolean;
  latitudeAtual: number | null;
  longitudeAtual: number | null;
  localizacaoAtualizadaEm: string | null;
  disponivel: boolean;
  veiculoTipo: string | null;
  veiculoPlaca: string | null;
  turno: string | null;
  fotoPerfilUrl: string | null;
  cnhUrl: string | null;
  documentoVeiculoUrl: string | null;
  seguroUrl: string | null;
  comprovanteResidenciaUrl: string | null;
  createdAt: string;
  updatedAt: string;
  /** Só presentes na resposta de /motoboys/admin-resumo. */
  statusCalculado?: StatusMotoboyCalculado;
  avaliacaoMedia?: number | null;
  avaliacaoQuantidade?: number;
  entregasTotais?: number;
}

export interface MotoboyAdminStats {
  total: number;
  ativos: number;
  emEntrega: number;
  disponiveis: number;
  inativos: number;
  documentos: { totalMotoboys: number; cnh: number; veiculo: number; seguro: number; comprovante: number; foto: number };
  entregasHoje: number;
  entregasSemana: number;
  entregasMes: number;
  taxaMediaEntrega: number;
  avaliacaoMediaGeral: number;
  taxaAceitacao: number;
  taxaCancelamento: number;
}

export interface MotoboyAdminResumo {
  motoboys: Motoboy[];
  stats: MotoboyAdminStats;
}

export interface PagamentoMotoboyLinha {
  id: string;
  motoboyId: string;
  motoboyNome: string;
  periodoDe: string;
  periodoAte: string;
  entregas: number;
  valorBruto: number;
  descontos: number;
  total: number;
  status: 'PAGO' | 'A_PAGAR';
}

export interface PagamentosMotoboyStats {
  aReceber: number;
  motoboysAReceber: number;
  jaPago: number;
  motoboysJaPago: number;
  esteMes: number;
  totalPagamentosEsteMes: number;
  mediaPorEntrega: number;
  formaPagamento: { formaPagamento: string; total: number }[];
  proximosPagamentos: PagamentoMotoboyLinha[];
}

export interface PagamentosMotoboyResumo {
  linhas: PagamentoMotoboyLinha[];
  stats: PagamentosMotoboyStats;
}

export interface MotoboySession {
  motoboyId: string;
  motoboyNome: string;
  empresaId: string;
  token: string;
  disponivel: boolean;
}
