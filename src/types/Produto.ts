export interface Categoria {
  id: string;
  empresaId: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriaInput {
  nome: string;
  ordem?: number;
  ativo?: boolean;
}

export interface Produto {
  id: string;
  empresaId: string;
  nome: string;
  descricao: string | null;
  categoriaId: string | null;
  categoria: Categoria | null;
  preco: number;
  precoPromocional: number | null;
  fotoUrl: string | null;
  ativo: boolean;
  ordem: number;
  esgotadoHoje: boolean;
  controlarEstoque: boolean;
  estoqueQtd: number | null;
  ehCombo: boolean;
  /** Computado pelo backend: ativo && !esgotadoHoje && (estoque não controlado ou > 0). */
  disponivel: boolean;
  gruposOpcao?: ProdutoGrupoOpcao[];
  createdAt: string;
  updatedAt: string;
}

export interface ProdutoInput {
  nome: string;
  descricao: string;
  categoria: string;
  preco: string;
  precoPromocional: string;
  fotoUrl: string;
  ativo: boolean;
}

export interface ProdutoVariacao {
  id: string;
  produtoId: string;
  nome: string;
  estoqueQtd: number | null;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProdutoVariacaoInput {
  nome: string;
  estoqueQtd: number | null;
}

export interface ProdutoOpcao {
  id: string;
  grupoId: string;
  nome: string;
  precoAdicional: number;
  /** Se true, a opção já vem marcada por padrão no modal do cliente (ele desmarca o que não quiser). */
  selecionadoPorPadrao: boolean;
  /** Foto e subtítulo opcionais, usados quando o grupo é exibido como cartões (ex: "No Saquinho" x "No Prato"). */
  fotoUrl: string | null;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProdutoOpcaoInput {
  nome: string;
  precoAdicional: number;
  selecionadoPorPadrao?: boolean;
  fotoUrl?: string | null;
  descricao?: string | null;
  ativo?: boolean;
}

export interface ProdutoGrupoOpcao {
  id: string;
  produtoId: string;
  nome: string;
  obrigatorio: boolean;
  selecaoMultipla: boolean;
  minSelecoes: number;
  maxSelecoes: number | null;
  ordem: number;
  createdAt: string;
  updatedAt: string;
  opcoes: ProdutoOpcao[];
}

export interface ProdutoGrupoOpcaoInput {
  nome: string;
  obrigatorio: boolean;
  selecaoMultipla: boolean;
  minSelecoes: number;
  maxSelecoes: number | null;
}
