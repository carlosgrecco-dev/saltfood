export type StatusFatura = 'PENDENTE' | 'PAGO' | 'ATRASADO';

export const STATUS_FATURA_LABELS: Record<StatusFatura, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  ATRASADO: 'Atrasado',
};

export interface Fatura {
  id: string;
  empresaId: string;
  empresa: { id: string; nome: string; slug: string };
  periodoInicio: string;
  periodoFim: string;
  valorVendas: number;
  comissaoPercent: number;
  valorComissao: number;
  valorPlano: number;
  valorTotal: number;
  status: StatusFatura;
  vencimento: string;
  pagoEm: string | null;
  observacoes: string | null;
  /** Computado: status != PAGO e vencimento já passou — não sobrescreve o status salvo. */
  atrasada: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GerarFaturaInput {
  empresaId: string;
  periodoInicio: string;
  periodoFim: string;
  vencimento: string;
}

export interface GerarLoteInput {
  periodoInicio: string;
  periodoFim: string;
  vencimento: string;
}

export interface GerarLoteResultado {
  geradas: number;
  puladas: string[];
}
