export type EventoWebhook = 'PEDIDO_CRIADO' | 'PEDIDO_STATUS_ALTERADO' | 'PEDIDO_CANCELADO' | 'AVALIACAO_RECEBIDA';

export const EVENTO_WEBHOOK_LABELS: Record<EventoWebhook, string> = {
  PEDIDO_CRIADO: 'Pedido criado',
  PEDIDO_STATUS_ALTERADO: 'Status do pedido alterado',
  PEDIDO_CANCELADO: 'Pedido cancelado',
  AVALIACAO_RECEBIDA: 'Avaliação recebida',
};

export interface WebhookConfig {
  id: string;
  empresaId: string;
  url: string;
  eventos: EventoWebhook[];
  secret: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  webhookConfigId: string;
  evento: string;
  statusCode: number | null;
  sucesso: boolean;
  erro: string | null;
  createdAt: string;
}

export interface WebhookResumo {
  config: WebhookConfig | null;
  logs: WebhookLog[];
  eventosDisponiveis: EventoWebhook[];
}

export interface WebhookInput {
  url?: string;
  eventos?: EventoWebhook[];
  ativo?: boolean;
}
