export type StatusTicketSuporte = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';

export const STATUS_TICKET_LABELS: Record<StatusTicketSuporte, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  RESOLVIDO: 'Resolvido',
};

export interface TicketSuporte {
  id: string;
  empresaId: string;
  pedidoId: string | null;
  pedido: { id: string; numero: number } | null;
  clienteId: string;
  cliente?: { id: string; nome: string; telefone: string | null; email: string };
  assunto: string;
  mensagem: string;
  status: StatusTicketSuporte;
  respostaAdmin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketInput {
  pedidoId?: string;
  assunto: string;
  mensagem: string;
}
