/** Pacote de funcionalidades incluídas no plano — sincronizado pra Empresa ao atribuir o plano (ver types/Empresa.ts pros mesmos campos). */
export interface PacoteFuncionalidades {
  habilitarFavoritos: boolean;
  habilitarPedirDeNovo: boolean;
  habilitarRankingFidelidade: boolean;
  habilitarAgendamento: boolean;
  habilitarAvaliacaoComFotos: boolean;
  habilitarNotificacoesInApp: boolean;
  habilitarMissoes: boolean;
  habilitarIndicacaoAvancada: boolean;
  habilitarAvaliacaoDetalhada: boolean;
  habilitarCentralSuporte: boolean;
}

export interface Plano extends PacoteFuncionalidades {
  id: string;
  nome: string;
  valorMensal: number;
  comissaoPercent: number;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  recursos: string[];
  limitePedidosMes: number | null;
  limiteProdutos: number | null;
  limiteUsuarios: number | null;
  limiteEntregadores: number | null;
  destaque: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { empresas: number };
}

export interface PlanoInput extends Partial<PacoteFuncionalidades> {
  nome: string;
  valorMensal: number;
  comissaoPercent: number;
  descricao?: string;
  recursos?: string[];
  limitePedidosMes?: number | null;
  limiteProdutos?: number | null;
  limiteUsuarios?: number | null;
  limiteEntregadores?: number | null;
  destaque?: boolean;
}
