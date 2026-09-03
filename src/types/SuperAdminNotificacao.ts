export type TipoNotificacaoSuperAdmin = 'FATURA_PENDENTE' | 'LEAD_NOVO' | 'CHAMADO_ABERTO' | 'TENANT_INATIVO';

export interface SuperAdminNotificacao {
  tipo: TipoNotificacaoSuperAdmin;
  descricao: string;
  data: string;
}

export interface SuperAdminNotificacoesResumo {
  notificacoes: SuperAdminNotificacao[];
  total: number;
}
