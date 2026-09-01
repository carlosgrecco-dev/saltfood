import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface TrendBadgeProps {
  atual: number;
  anterior: number;
  /** 'escuro' = pra usar sobre fundo colorido/gradiente; 'claro' = pra usar sobre fundo branco. */
  variante?: 'escuro' | 'claro';
}

/** Selo verde/vermelho com seta indicando a variação % vs período anterior. */
const TrendBadge: React.FC<TrendBadgeProps> = ({ atual, anterior, variante = 'claro' }) => {
  if (!anterior) return null;
  const percentual = ((atual - anterior) / anterior) * 100;
  const subiu = percentual >= 0;
  const cores = variante === 'escuro'
    ? (subiu ? 'bg-emerald-500/20 text-emerald-50' : 'bg-red-500/20 text-red-50')
    : (subiu ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700');

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${cores}`}>
      {subiu ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(percentual).toFixed(0)}%
    </span>
  );
};

export default TrendBadge;
