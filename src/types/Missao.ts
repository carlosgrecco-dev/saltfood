export interface Missao {
  id: string;
  empresaId: string;
  titulo: string;
  descricao: string | null;
  metaPedidos: number;
  periodoDias: number;
  recompensaUnidades: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MissaoInput {
  titulo: string;
  descricao?: string;
  metaPedidos: number;
  periodoDias: number;
  recompensaUnidades: number;
  ativo?: boolean;
}

export interface MissaoParticipacao {
  id: string;
  missaoId: string;
  clienteId: string;
  iniciadaEm: string;
  concluidaEm: string | null;
  recompensada: boolean;
}

export interface MissaoProgresso {
  pedidosCount: number;
  expiraEm: string;
  expirada: boolean;
}

/** Forma devolvida por GET /missoes quando quem chama é um cliente logado — inclui a participação e o progresso dele. */
export interface MissaoComProgresso extends Missao {
  participacaoAtual: MissaoParticipacao | null;
  progresso: MissaoProgresso | null;
}
