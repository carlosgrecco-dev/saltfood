export type TipoLogAtividadeLoja =
  | 'PEDIDO_CANCELADO'
  | 'PRODUTO_CRIADO'
  | 'PRODUTO_REMOVIDO'
  | 'CONFIG_PAGAMENTO_ALTERADA'
  | 'USUARIO_ADMIN_CRIADO'
  | 'USUARIO_ADMIN_REMOVIDO';

export const TIPO_LOG_ATIVIDADE_LABELS: Record<TipoLogAtividadeLoja, string> = {
  PEDIDO_CANCELADO: 'Pedido cancelado',
  PRODUTO_CRIADO: 'Produto criado',
  PRODUTO_REMOVIDO: 'Produto removido',
  CONFIG_PAGAMENTO_ALTERADA: 'Config. de pagamento alterada',
  USUARIO_ADMIN_CRIADO: 'Usuário criado',
  USUARIO_ADMIN_REMOVIDO: 'Usuário removido',
};

export interface LogAtividadeLoja {
  id: string;
  empresaId: string;
  tipo: TipoLogAtividadeLoja;
  ator: string | null;
  descricao: string;
  createdAt: string;
}
