export type PapelUsuarioAdmin = 'GERENTE' | 'OPERADOR_CAIXA' | 'ATENDENTE';

export const PAPEL_USUARIO_ADMIN_LABELS: Record<PapelUsuarioAdmin, string> = {
  GERENTE: 'Gerente',
  OPERADOR_CAIXA: 'Operador de caixa',
  ATENDENTE: 'Atendente',
};

export interface UsuarioAdmin {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  papel: PapelUsuarioAdmin;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioAdminInput {
  nome: string;
  email: string;
  senha: string;
  papel: PapelUsuarioAdmin;
}
