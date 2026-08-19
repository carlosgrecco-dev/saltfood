import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { fetchHeroSlides } from '../lib/heroSlides';

interface Slide {
  id: string;
  titulo: string;
  subtitulo: string | null;
  imagemUrl: string | null;
  linkUrl: string | null;
  badgeLabel: string | null;
}

const AUTOPLAY_MS = 5500;

const Hero: React.FC = () => {
  const { empresa } = useTenant();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const slideEstatico: Slide = {
    id: 'estatico',
    titulo: empresa.heroTitulo || `Bem-vindo à ${empresa.nome}`,
    subtitulo: empresa.heroSubtitulo || empresa.descricao || 'Peça agora e receba rapidinho, direto na sua porta.',
    imagemUrl: empresa.heroImagemUrl,
    linkUrl: empresa.heroLinkUrl,
    badgeLabel: empresa.heroBadgeLabel,
  };

  const loadSlides = useCallback(async () => {
    if (!empresa.heroUsarCarrossel) {
      setSlides([slideEstatico]);
      setIndex(0);
      return;
    }
    try {
      const data = await fetchHeroSlides(empresa.id, true);
      setSlides(
        data.length > 0
          ? data.map((s) => ({ id: s.id, titulo: s.titulo, subtitulo: s.subtitulo, imagemUrl: s.imagemUrl, linkUrl: s.linkUrl, badgeLabel: s.badgeLabel }))
          : [slideEstatico]
      );
      setIndex(0);
    } catch {
      setSlides([slideEstatico]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa.id, empresa.heroUsarCarrossel]);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  const goTo = (i: number) => setIndex(((i % slides.length) + slides.length) % slides.length);
  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length]);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, slides.length]);

  const resetAutoplay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (slides.length > 1) timerRef.current = setInterval(next, AUTOPLAY_MS);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta > 0) prev(); else next();
      resetAutoplay();
    }
    touchStartX.current = null;
  };

  const handleSlideClick = (slide: Slide) => {
    if (slide.linkUrl) {
      window.open(slide.linkUrl, slide.linkUrl.startsWith('http') ? '_blank' : '_self');
    } else {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (slides.length === 0) return null;

  return (
    <section className="px-4 pt-4">
      <div
        className="relative overflow-hidden rounded-3xl shadow-lg"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`${i === index ? 'relative opacity-100' : 'absolute inset-0 opacity-0 pointer-events-none'} transition-opacity duration-500 bg-cover bg-center cursor-pointer`}
            style={
              s.imagemUrl
                ? { backgroundImage: `url('${s.imagemUrl}')` }
                : { background: 'linear-gradient(to bottom right, var(--cor-primaria), var(--cor-secundaria))' }
            }
            onClick={() => i === index && handleSlideClick(s)}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

            <div className="relative z-10 px-6 py-8 sm:py-10 min-h-[220px] sm:min-h-[260px] flex flex-col justify-end">
              {s.badgeLabel && (
                <span className="self-start bg-yellow-400 text-orange-900 text-xs font-bold px-3 py-1 rounded-full mb-3">
                  {s.badgeLabel}
                </span>
              )}

              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{s.titulo}</h1>

              {s.subtitulo && (
                <p className="text-white/90 text-sm sm:text-base mt-1 mb-5 max-w-md">{s.subtitulo}</p>
              )}

              {s.id === 'estatico' && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                    <Truck className="h-3.5 w-3.5" /> Entrega rápida
                  </span>
                  {empresa.horarioFuncionamento && (
                    <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      <Clock className="h-3.5 w-3.5" /> {empresa.horarioFuncionamento}
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSlideClick(s);
                }}
                className="self-start bg-[var(--cor-primaria)] text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:brightness-110 hover:scale-105 transition-all duration-200"
              >
                {s.id === 'estatico' ? 'Ver Cardápio' : s.linkUrl ? 'Aproveitar' : 'Ver Cardápio'}
              </button>
            </div>
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
                resetAutoplay();
              }}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-2 transition-colors"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
                resetAutoplay();
              }}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-2 transition-colors"
              aria-label="Próximo slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-20">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(i);
                    resetAutoplay();
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                  aria-label={`Ir para o slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Hero;
