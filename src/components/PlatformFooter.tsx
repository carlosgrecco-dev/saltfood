import React from 'react';
import { Link } from 'react-router-dom';

/** Rodapé compartilhado pelas páginas da própria plataforma (landing, parceiro, política de
 * privacidade) — diferente de components/Footer.tsx, que é o rodapé de cada loja (tenant). */
const PlatformFooter: React.FC = () => {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 shrink-0 rounded-lg bg-black p-1">
          <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-sm" />
        </div>
        <span className="text-xs text-slate-400">SaltFood — uma plataforma Sigma Soluções Digitais</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <Link to="/planos" className="hover:text-slate-600 transition-colors">Planos</Link>
        <Link to="/parceiro" className="hover:text-slate-600 transition-colors">Seja um parceiro</Link>
        <Link to="/politica-de-privacidade" className="hover:text-slate-600 transition-colors">Política de Privacidade</Link>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
};

export default PlatformFooter;
