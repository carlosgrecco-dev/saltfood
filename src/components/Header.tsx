import React from 'react';
import { Instagram, Facebook, Store } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import InstallAppButton from './InstallAppButton';

interface HeaderProps {
  /** Controles extras (ex: menu hambúrguer + botões do admin) exibidos à direita da barra. */
  rightExtra?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ rightExtra }) => {
  const { empresa } = useTenant();

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-sm safe-top">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 min-w-0">
            {empresa.logoUrl ? (
              <img
                src={empresa.logoUrl}
                alt={`Logo ${empresa.nome}`}
                className="h-10 w-10 rounded-full shadow-sm object-cover shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Store className="h-5 w-5 text-[var(--cor-primaria)]" />
              </div>
            )}
            <div className="leading-tight min-w-0">
              <h1 className="text-base font-bold text-gray-800 truncate">{empresa.nome}</h1>
              {empresa.descricao && <p className="text-[11px] text-gray-500 truncate">{empresa.descricao}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <InstallAppButton />
            {rightExtra}
            {(empresa.instagramUrl || empresa.facebookUrl) && (
              <div className="hidden sm:flex items-center space-x-2 shrink-0">
                {empresa.instagramUrl && (
                  <a
                    href={empresa.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:scale-110 transition-transform duration-200"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {empresa.facebookUrl && (
                  <a
                    href={empresa.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-blue-600 text-white rounded-full hover:scale-110 transition-transform duration-200"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
