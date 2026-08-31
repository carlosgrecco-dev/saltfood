import React from 'react';
import { SiteBlocoPublico } from '../../types/SiteBloco';

interface BlocoHeroProps {
  bloco: SiteBlocoPublico | undefined;
  fallback: { eyebrow?: string; titulo: string; subtitulo: string };
  variant?: 'light' | 'dark';
  /** Classe do parágrafo de subtítulo (largura/centralização variam por página, ex: "max-w-md" ou "max-w-lg mx-auto"). */
  subtituloClassName?: string;
}

/** Renderiza só o texto do hero (eyebrow/h1/subtítulo) — a seção ao redor (alinhamento, imagem,
 * botões) fica no JSX de cada página, já que cada uma tem um hero visualmente diferente.
 * Fallback campo-a-campo: um bloco parcialmente preenchido no CMS nunca some com um campo. */
const BlocoHero: React.FC<BlocoHeroProps> = ({ bloco, fallback, variant = 'light', subtituloClassName = '' }) => {
  const eyebrow = bloco?.eyebrow || fallback.eyebrow;
  const titulo = bloco?.titulo || fallback.titulo;
  const subtitulo = bloco?.subtitulo || fallback.subtitulo;
  const corEyebrow = variant === 'dark' ? 'text-orange-400' : 'text-orange-600';
  const corTitulo = variant === 'dark' ? 'text-white' : 'text-slate-900';
  const corSubtitulo = variant === 'dark' ? 'text-slate-300' : 'text-slate-500';

  return (
    <>
      {eyebrow && <p className={`font-semibold text-sm ${corEyebrow}`}>{eyebrow}</p>}
      <h1 className={`mt-2 text-3xl sm:text-4xl font-bold leading-tight ${corTitulo}`}>{titulo}</h1>
      <p className={`mt-4 ${corSubtitulo} ${subtituloClassName}`}>{subtitulo}</p>
    </>
  );
};

export default BlocoHero;
