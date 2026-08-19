export interface Motoboy {
  id: string;
  empresaId: string;
  nome: string;
  telefone: string | null;
  taxaPadrao: number;
  ativo: boolean;
  latitudeAtual: number | null;
  longitudeAtual: number | null;
  localizacaoAtualizadaEm: string | null;
  disponivel: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MotoboySession {
  motoboyId: string;
  motoboyNome: string;
  empresaId: string;
  token: string;
  disponivel: boolean;
}
