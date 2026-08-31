import React from 'react';
import { getIconeSite } from '../../data/iconesSite';
import { SiteBlocoPublico } from '../../types/SiteBloco';

interface ItemFallback {
  icon: React.ComponentType<{ className?: string }>;
  titulo: string;
  texto: string;
}

interface BlocoListaIconesProps {
  bloco: SiteBlocoPublico | undefined;
  fallback: ItemFallback[];
  gridClassName: string;
}

/** Renderiza só a grade de cards ícone+título+texto — o heading acima dela fica no JSX da página.
 * Usa os itens do CMS quando existirem; senão cai pro array hardcoded (que já usa os componentes
 * de ícone importados, sem passar pelo mapa de nomes). */
const BlocoListaIcones: React.FC<BlocoListaIconesProps> = ({ bloco, fallback, gridClassName }) => {
  const itensCms = bloco?.itens;

  if (itensCms && itensCms.length > 0) {
    return (
      <div className={gridClassName}>
        {itensCms.map((item, i) => {
          const Icon = getIconeSite(item.icone);
          return (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                <Icon className="h-4 w-4 text-orange-600" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">{item.titulo}</h4>
              <p className="text-xs text-slate-500">{item.texto}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={gridClassName}>
      {fallback.map(({ icon: Icon, titulo, texto }) => (
        <div key={titulo} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
            <Icon className="h-4 w-4 text-orange-600" />
          </div>
          <h4 className="font-semibold text-slate-800 text-sm mb-1">{titulo}</h4>
          <p className="text-xs text-slate-500">{texto}</p>
        </div>
      ))}
    </div>
  );
};

export default BlocoListaIcones;
