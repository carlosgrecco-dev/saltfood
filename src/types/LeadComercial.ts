export type StatusLeadComercial = 'NOVO' | 'CONTATADO' | 'CONVERTIDO' | 'DESCARTADO';

export const STATUS_LEAD_LABELS: Record<StatusLeadComercial, string> = {
  NOVO: 'Novo',
  CONTATADO: 'Contatado',
  CONVERTIDO: 'Convertido',
  DESCARTADO: 'Descartado',
};

export interface LeadComercial {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  mensagem: string | null;
  planoInteresseId: string | null;
  planoInteresse: { id: string; nome: string } | null;
  status: StatusLeadComercial;
  notaInterna: string | null;
  origem: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadComercialInput {
  nome: string;
  email: string;
  telefone?: string;
  mensagem?: string;
  planoInteresseId?: string;
  origem?: string;
  /** Campo-armadilha anti-bot — sempre vazio num envio humano de verdade. */
  _hp?: string;
}
