export type ProvedorGateway = 'PIX_MANUAL' | 'PAGSEGURO' | 'MERCADOPAGO' | 'STRIPE';

export interface GatewayPagamento {
  id: string | null;
  empresaId: string;
  provider: ProvedorGateway;
  nomeExibicao: string;
  ativo: boolean;
  chavePublica: string | null;
  chaveSecreta: string | null;
  webhookSecret: string | null;
}
