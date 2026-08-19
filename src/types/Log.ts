export type TipoLog = 'ACESSO' | 'ERRO' | 'ALTERACAO_CRITICA';

export const TIPO_LOG_LABELS: Record<TipoLog, string> = {
  ACESSO: 'Acesso',
  ERRO: 'Erro do servidor',
  ALTERACAO_CRITICA: 'Alteração crítica',
};

export interface LogAuditoria {
  id: string;
  tipo: TipoLog;
  empresaId: string | null;
  empresaNome: string | null;
  ator: string | null;
  acao: string;
  detalhes: Record<string, unknown> | null;
  createdAt: string;
}

export interface GatewayStatus {
  id: string;
  provider: string;
  nomeExibicao: string;
  ativo: boolean;
  updatedAt: string;
  empresa: { id: string; nome: string; slug: string };
}
