export interface Fornecedor {
  id: string;
  empresaId: string;
  nome: string;
  contato: string | null;
  categoria: string | null;
  observacoes: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FornecedorInput {
  nome: string;
  contato?: string;
  categoria?: string;
  observacoes?: string;
}
