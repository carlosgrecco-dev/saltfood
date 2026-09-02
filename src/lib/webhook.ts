import { WebhookConfig, WebhookInput, WebhookResumo } from '../types/Webhook';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchWebhook(empresaId: string): Promise<WebhookResumo> {
  return apiRequestAsAdmin<WebhookResumo>(empresaId, `/empresas/${empresaId}/webhook`);
}

export async function salvarWebhook(empresaId: string, input: WebhookInput): Promise<WebhookConfig> {
  return apiRequestAsAdmin<WebhookConfig>(empresaId, `/empresas/${empresaId}/webhook`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function regenerarSecretWebhook(empresaId: string): Promise<WebhookConfig> {
  return apiRequestAsAdmin<WebhookConfig>(empresaId, `/empresas/${empresaId}/webhook/regenerar-secret`, { method: 'POST' });
}
