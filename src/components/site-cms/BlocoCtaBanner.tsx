import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquarePlus } from 'lucide-react';
import { getIconeSite } from '../../data/iconesSite';
import { CTA_ABRIR_CONTATO, SiteBlocoPublico } from '../../types/SiteBloco';

interface BlocoCtaBannerProps {
  bloco: SiteBlocoPublico | undefined;
  fallback: { icone: string; titulo: string; texto: string; textoBotao: string; linkBotao: string };
  onAbrirContato: () => void;
}

/** Renderiza o cartão inteiro do banner (fundo escuro, círculo do ícone, título, texto e botão) —
 * a <section> com o espaçamento/max-w ao redor fica em cada página. O botão navega via <Link>
 * (com seta) ou abre o ContatoComercialDrawer da própria página (com ícone de balão), dependendo
 * de linkBotao ser um caminho interno ou o sentinel CTA_ABRIR_CONTATO. */
const BlocoCtaBanner: React.FC<BlocoCtaBannerProps> = ({ bloco, fallback, onAbrirContato }) => {
  const icone = bloco?.icone || fallback.icone;
  const titulo = bloco?.titulo || fallback.titulo;
  const texto = bloco?.texto || fallback.texto;
  const textoBotao = bloco?.textoBotao || fallback.textoBotao;
  const linkBotao = bloco?.linkBotao || fallback.linkBotao;
  const Icon = getIconeSite(icone);

  const botaoClassName = 'mt-6 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors';

  return (
    <div className="bg-slate-900 rounded-3xl px-6 py-10 sm:px-12 sm:py-12 text-center">
      <div className="h-11 w-11 rounded-2xl bg-orange-600/20 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-5 w-5 text-orange-400" />
      </div>
      <h2 className="text-white font-bold text-xl sm:text-2xl">{titulo}</h2>
      <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto">{texto}</p>
      {linkBotao === CTA_ABRIR_CONTATO ? (
        <button onClick={onAbrirContato} className={botaoClassName}>
          <MessageSquarePlus className="h-4 w-4" /> {textoBotao}
        </button>
      ) : (
        <Link to={linkBotao} className={botaoClassName}>
          {textoBotao} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
};

export default BlocoCtaBanner;
