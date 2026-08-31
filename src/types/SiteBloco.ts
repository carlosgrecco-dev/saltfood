export type PaginaSite = 'LANDING' | 'PARCEIRO' | 'PLANOS' | 'RECURSOS' | 'POLITICA_PRIVACIDADE';

export type TipoBlocoSite = 'HERO' | 'LISTA_ICONES' | 'CTA_BANNER';

/** Sentinel gravado em linkBotao pra indicar "abre o ContatoComercialDrawer" em vez de navegar. */
export const CTA_ABRIR_CONTATO = 'abrir-contato';

export interface ItemListaIcones {
  icone: string;
  titulo: string;
  texto: string;
}

export interface SiteBloco {
  id: string;
  pagina: PaginaSite;
  chave: string;
  tipo: TipoBlocoSite;
  ativo: boolean;
  ordem: number;
  eyebrow: string | null;
  icone: string | null;
  titulo: string | null;
  subtitulo: string | null;
  texto: string | null;
  textoBotao: string | null;
  linkBotao: string | null;
  itens: ItemListaIcones[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteBlocoInput {
  pagina: PaginaSite;
  chave: string;
  tipo: TipoBlocoSite;
  ativo?: boolean;
  ordem?: number;
  eyebrow?: string | null;
  icone?: string | null;
  titulo?: string | null;
  subtitulo?: string | null;
  texto?: string | null;
  textoBotao?: string | null;
  linkBotao?: string | null;
  itens?: ItemListaIcones[];
}

/** Subconjunto público de SiteBloco (GET /site-blocos/publico) — sem ativo nem timestamps. */
export interface SiteBlocoPublico {
  id: string;
  pagina: PaginaSite;
  chave: string;
  tipo: TipoBlocoSite;
  eyebrow: string | null;
  icone: string | null;
  titulo: string | null;
  subtitulo: string | null;
  texto: string | null;
  textoBotao: string | null;
  linkBotao: string | null;
  itens: ItemListaIcones[] | null;
}
