import { GatewayPagamento, ProvedorGateway } from '../types/GatewayPagamento';
import { apiRequestAsAdmin } from './adminAuth';

export async function fetchGatewaysPagamento(empresaId: string): Promise<GatewayPagamento[]> {
  return apiRequestAsAdmin<GatewayPagamento[]>(empresaId, `/empresas/${empresaId}/gateways-pagamento`);
}

export interface GatewayPagamentoPayload {
  ativo?: boolean;
  chavePublica?: string;
  chaveSecreta?: string;
  webhookSecret?: string;
}

export async function updateGatewayPagamento(
  empresaId: string,
  provider: ProvedorGateway,
  payload: GatewayPagamentoPayload
): Promise<GatewayPagamento> {
  return apiRequestAsAdmin<GatewayPagamento>(empresaId, `/empresas/${empresaId}/gateways-pagamento/${provider}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
