export interface HorarioFuncionamento {
  id: string;
  empresaId: string;
  diaSemana: number; // 0=domingo ... 6=sábado
  abre: string | null;
  fecha: string | null;
  fechado: boolean;
}

/** Dados públicos usados para resolver a loja pelo slug (sem informações sensíveis). */
export interface EmpresaPublic {
  id: string;
  nome: string;
  slug: string;
  empresaAtiva: boolean;
  telefone: string;
  descricao: string | null;
  sobre: string | null;
  endereco: string | null;
  horarioFuncionamento: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  logoUrl: string | null;
  taxaEntrega: number;
  corPrimaria: string;
  corSecundaria: string;
  faviconUrl: string | null;
  heroUsarCarrossel: boolean;
  heroTitulo: string | null;
  heroSubtitulo: string | null;
  heroBadgeLabel: string | null;
  heroImagemUrl: string | null;
  heroLinkUrl: string | null;
  termosConteudo: string | null;
  googleBusinessReviewUrl: string | null;
  fidelidadeLogoUrl: string | null;
  fidelidadeValidadeDias: number | null;
  fidelidadeAvisoFaltam: number | null;
  fidelidadeNomeItem: string | null;
  cashbackPercent: number | null;
  /** SaltFood Coins — opt-in pra participar da carteira global (independente do cashback local acima). */
  participaSaltfoodCoins: boolean;
  saltfoodCoinsPercent: number | null;
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
  indicacaoRecompensaUnidades: number;
  lojaAbertaManual: boolean;
  usarHorarioAutomatico: boolean;
  tempoEstimadoMin: number | null;
  tempoEstimadoMax: number | null;
  pedidoMinimo: number;
  freteGratisAcimaDe: number | null;
  horarios: HorarioFuncionamento[];
  abertaAgora: boolean;
}

export interface Empresa {
  id: string;
  nome: string;
  responsavelNome: string;
  email: string;
  telefone: string;
  documento: string;
  slug: string;
  usuario: string;
  empresaAtiva: boolean;
  adminAtivo: boolean;
  descricao: string | null;
  sobre: string | null;
  endereco: string | null;
  horarioFuncionamento: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  logoUrl: string | null;
  taxaEntrega: number;
  comissaoPercent: number;
  /** Se true, o card "Comissão da plataforma" fica oculto no CRM do próprio tenant. Só o Super Admin altera. */
  ocultarComissaoTenant: boolean;
  corPrimaria: string;
  corSecundaria: string;
  faviconUrl: string | null;
  heroUsarCarrossel: boolean;
  heroTitulo: string | null;
  heroSubtitulo: string | null;
  heroBadgeLabel: string | null;
  heroImagemUrl: string | null;
  heroLinkUrl: string | null;
  termosConteudo: string | null;
  googleBusinessReviewUrl: string | null;
  fidelidadeLogoUrl: string | null;
  fidelidadeValidadeDias: number | null;
  fidelidadeAvisoFaltam: number | null;
  fidelidadeNomeItem: string | null;
  cashbackPercent: number | null;
  /** SaltFood Coins — opt-in pra participar da carteira global (independente do cashback local acima). */
  participaSaltfoodCoins: boolean;
  saltfoodCoinsPercent: number | null;
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
  indicacaoRecompensaUnidades: number;
  /** Código próprio da loja pra indicar outros lojistas à plataforma (indicação tenant-a-tenant, diferente da indicação cliente-a-cliente). */
  codigoIndicacao: string | null;
  indicadaPorEmpresaId: string | null;
  /** Só vem preenchido na listagem do Super Admin (GET /empresas), que inclui essa relação. */
  indicadaPor?: { id: string; nome: string; codigoIndicacao: string | null } | null;
  indicacaoEmpresaRecompensada: boolean;
  creditoIndicacaoEmpresa: number;
  lojaAbertaManual: boolean;
  usarHorarioAutomatico: boolean;
  tempoEstimadoMin: number | null;
  tempoEstimadoMax: number | null;
  pedidoMinimo: number;
  freteGratisAcimaDe: number | null;
  planoId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmpresaFormInput {
  nome: string;
  responsavelNome: string;
  email: string;
  telefone: string;
  documento: string;
  slug: string;
  usuario: string;
  senha: string;
  empresaAtiva: boolean;
  adminAtivo: boolean;
  /** Só usado na criação — atribui o plano já no ato do cadastro (sincroniza a comissão automaticamente). */
  planoId?: string;
  /** Só usado na criação quando nenhum plano é escolhido — comissão avulsa (0 a 30%). */
  comissaoPercent?: number;
  /** Só usado na criação — código de indicação de outra loja da plataforma (indicação tenant-a-tenant), opcional. */
  indicadoPor?: string;
}

export interface FidelidadeConfigInput {
  fidelidadeLogoUrl: string | null;
  fidelidadeValidadeDias: number | null;
  fidelidadeAvisoFaltam: number | null;
  fidelidadeNomeItem: string | null;
  cashbackPercent: number | null;
  saltfoodCoinsPercent: number | null;
}

export interface FuncionalidadesConfigInput {
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
  participaSaltfoodCoins: boolean;
  indicacaoRecompensaUnidades: number;
}

export interface AparenciaInput {
  corPrimaria: string;
  corSecundaria: string;
  logoUrl: string;
  faviconUrl: string;
  heroUsarCarrossel: boolean;
  heroTitulo: string;
  heroSubtitulo: string;
  heroBadgeLabel: string;
  heroImagemUrl: string;
  heroLinkUrl: string;
  termosConteudo: string;
  googleBusinessReviewUrl: string;
}
