export type StatusTicketSuporte = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';

export const STATUS_TICKET_LABELS: Record<StatusTicketSuporte, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  RESOLVIDO: 'Resolvido',
};

export type PrioridadeChamado = 'RELEVANTE' | 'PRIORITARIA' | 'URGENTE';

export const PRIORIDADE_CHAMADO_LABELS: Record<PrioridadeChamado, string> = {
  RELEVANTE: 'Relevante',
  PRIORITARIA: 'Prioritária',
  URGENTE: 'Urgente',
};

export const PRIORIDADE_CHAMADO_SLA: Record<PrioridadeChamado, string> = {
  RELEVANTE: 'resposta em até 48h',
  PRIORITARIA: 'resposta em até 24h',
  URGENTE: 'resposta em até 12h',
};

/** Ticket de cliente (clienteId preenchido) OU chamado do lojista com a Sigma (clienteId null,
 * prioridade sempre preenchida) — mesma tabela, dois usos diferentes. */
export interface TicketSuporte {
  id: string;
  empresaId: string;
  empresa?: { id: string; nome: string };
  pedidoId: string | null;
  pedido: { id: string; numero: number } | null;
  clienteId: string | null;
  cliente?: { id: string; nome: string; telefone: string | null; email: string };
  assunto: string;
  mensagem: string;
  status: StatusTicketSuporte;
  prioridade: PrioridadeChamado | null;
  respostaAdmin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketInput {
  pedidoId?: string;
  assunto: string;
  mensagem: string;
}

export interface TicketLojistaInput {
  assunto: string;
  mensagem: string;
  prioridade: PrioridadeChamado;
}
