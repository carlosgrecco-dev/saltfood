export type StatusCampanhaMarketing = 'RASCUNHO' | 'ATIVA' | 'PAUSADA' | 'ENCERRADA';

export const STATUS_CAMPANHA_LABELS: Record<StatusCampanhaMarketing, string> = {
  RASCUNHO: 'Rascunho',
  ATIVA: 'Ativa',
  PAUSADA: 'Pausada',
  ENCERRADA: 'Encerrada',
};

export interface CampanhaMarketing {
  id: string;
  nome: string;
  publicoAlvo: string;
  mensagem: string;
  dataInicio: string;
  dataFim: string | null;
  status: StatusCampanhaMarketing;
  createdAt: string;
  updatedAt: string;
}

export interface CampanhaMarketingInput {
  nome: string;
  publicoAlvo: string;
  mensagem: string;
  dataInicio: string;
  dataFim?: string | null;
  status?: StatusCampanhaMarketing;
}
