import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import InstallAppButton from './InstallAppButton';

interface PublicHeaderProps {
  /** Abre o drawer de contato comercial da página atual. Omitido, o botão "Falar com a gente" some. */
  onFalarComAGente?: () => void;
}

/** Header reutilizado em toda página pública (fora do painel de uma loja) — Landing, Parceiro,
 * Planos, Recursos e Política de Privacidade — pra manter logo, navegação e ações sempre no mesmo
 * lugar. Fundo escuro de propósito: destaca o header da página (branca) atrás dele. */
const PublicHeader: React.FC<PublicHeaderProps> = ({ onFalarComAGente }) => (
  <header className="bg-slate-900 border-b border-white/10">
    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
      <Link to="/" className="h-10 w-10 shrink-0 rounded-xl bg-black ring-1 ring-white/10 p-1">
        <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-md" />
      </Link>
      <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-300">
        <Link to="/recursos" className="hover:text-white transition-colors">Recursos</Link>
        <Link to="/planos" className="hover:text-white transition-colors">Planos</Link>
        <Link to="/parceiro" className="hover:text-white transition-colors">Seja um parceiro</Link>
        <Link to="/politica-de-privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
      </nav>
      <div className="flex items-center gap-2">
        {onFalarComAGente && (
          <button
            onClick={onFalarComAGente}
            className="hidden sm:inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" /> Falar com a gente
          </button>
        )}
        <InstallAppButton />
      </div>
    </div>
  </header>
);

export default PublicHeader;
