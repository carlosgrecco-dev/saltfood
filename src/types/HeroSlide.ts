export interface HeroSlide {
  id: string;
  empresaId: string;
  imagemUrl: string;
  titulo: string;
  subtitulo: string | null;
  badgeLabel: string | null;
  linkUrl: string | null;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSlideInput {
  imagemUrl: string;
  titulo: string;
  subtitulo?: string;
  badgeLabel?: string;
  linkUrl?: string;
  ordem?: number;
  ativo?: boolean;
}
